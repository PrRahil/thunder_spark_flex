import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { BlockJob, FilterPreset, GrabbedBlock } from '@thunder-spark/shared';
import { BLOCK_JOB_STATUS, SERVICE_FEE_CENTS } from '@thunder-spark/shared';
import { pickBestBlock } from '@thunder-spark/provider-core';
import { InMemoryStore } from '../../store/in-memory.store';
import { FiltersService } from '../filters/filters.service';
import { ProvidersService } from '../providers/providers.service';
import { WalletService } from '../wallet/wallet.service';
import { AmazonFlexAdapter } from './amazon-flex.adapter';

@Injectable()
export class BlockEngineService {
  private readonly logger = new Logger(BlockEngineService.name);
  private readonly activeLoops = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly store: InMemoryStore,
    private readonly filtersService: FiltersService,
    private readonly providersService: ProvidersService,
    private readonly walletService: WalletService,
    private readonly amazonFlexAdapter: AmazonFlexAdapter,
  ) {}

  startJob(job: BlockJob, filter: FilterPreset): void {
    if (this.activeLoops.has(job.id)) return;

    const tick = async () => {
      const current = this.store.blockJobs.get(job.id);
      if (!current || current.status !== BLOCK_JOB_STATUS.RUNNING) {
        this.stopLoop(job.id);
        return;
      }

      const connection = this.providersService.getActiveAmazonFlex(job.userId);
      if (!connection || !(await this.amazonFlexAdapter.validateSession(connection))) {
        this.failJob(job.id, 'Amazon Flex session expired. Please reconnect.');
        return;
      }

      current.pollCount = (current.pollCount ?? 0) + 1;
      this.store.blockJobs.set(job.id, current);

      const blocks = await this.amazonFlexAdapter.listAvailableBlocks(connection);
      const best = pickBestBlock(blocks, filter);

      if (best) {
        const result = await this.amazonFlexAdapter.acceptBlock(connection, best.id);
        if (result.captchaRequired) {
          this.pauseJob(job.id, 'Captcha required. Complete verification in app.');
          return;
        }
        if (result.success) {
          this.completeJob(job.id, best);
        }
      }
    };

    const interval = setInterval(() => {
      tick().catch((err) => this.logger.error(`Poll error for job ${job.id}`, err));
    }, 2000);

    this.activeLoops.set(job.id, interval);
    tick().catch((err) => this.logger.error(`Initial poll error for job ${job.id}`, err));
  }

  stopLoop(jobId: string): void {
    const interval = this.activeLoops.get(jobId);
    if (interval) {
      clearInterval(interval);
      this.activeLoops.delete(jobId);
    }
  }

  private completeJob(
    jobId: string,
    block: { id: string; wageCents: number; locationName: string; startTime: string },
  ): void {
    const job = this.store.blockJobs.get(jobId);
    if (!job) return;

    this.walletService.chargeServiceFee(job.userId, jobId);

    const grabbed: GrabbedBlock = {
      id: randomUUID(),
      blockJobId: jobId,
      providerBlockId: block.id,
      wageCents: block.wageCents,
      locationName: block.locationName,
      startTime: block.startTime,
      feeChargedCents: SERVICE_FEE_CENTS,
      status: 'ACTIVE',
    };

    job.status = BLOCK_JOB_STATUS.SUCCESS;
    job.stoppedAt = new Date().toISOString();
    job.grabbedBlock = grabbed;
    this.store.blockJobs.set(jobId, job);
    this.stopLoop(jobId);
  }

  private failJob(jobId: string, message: string): void {
    const job = this.store.blockJobs.get(jobId);
    if (!job) return;
    job.status = BLOCK_JOB_STATUS.FAILED;
    job.lastError = message;
    job.stoppedAt = new Date().toISOString();
    this.store.blockJobs.set(jobId, job);
    this.stopLoop(jobId);
  }

  private pauseJob(jobId: string, message: string): void {
    const job = this.store.blockJobs.get(jobId);
    if (!job) return;
    job.status = BLOCK_JOB_STATUS.PAUSED;
    job.lastError = message;
    this.store.blockJobs.set(jobId, job);
    this.stopLoop(jobId);
  }
}
