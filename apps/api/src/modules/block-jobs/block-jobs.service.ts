import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { BlockJob, User } from '@thunder-spark/shared';
import { BLOCK_JOB_STATUS, ERROR_CODES, startBlockJobSchema } from '@thunder-spark/shared';
import { InMemoryStore } from '../../store/in-memory.store';
import { FiltersService } from '../filters/filters.service';
import { ProvidersService } from '../providers/providers.service';
import { WalletService } from '../wallet/wallet.service';
import { BlockEngineService } from '../block-engine/block-engine.service';

@Injectable()
export class BlockJobsService {
  constructor(
    private readonly store: InMemoryStore,
    private readonly filtersService: FiltersService,
    private readonly walletService: WalletService,
    private readonly providersService: ProvidersService,
    private readonly blockEngine: BlockEngineService,
  ) {}

  list(userId: string): BlockJob[] {
    return [...this.store.blockJobs.values()].filter((j) => j.userId === userId);
  }

  get(userId: string, id: string): BlockJob {
    const job = this.store.blockJobs.get(id);
    if (!job || job.userId !== userId) {
      throw new NotFoundException('Block job not found');
    }
    return job;
  }

  start(user: User, body: unknown): BlockJob {
    const { filterPresetId } = startBlockJobSchema.parse(body);

    const running = this.list(user.id).find((j) => j.status === BLOCK_JOB_STATUS.RUNNING);
    if (running) {
      throw new ConflictException({
        code: ERROR_CODES.BLOCK_JOB_ALREADY_RUNNING,
        message: 'A block search is already running',
      });
    }

    if (!this.walletService.hasSufficientBalance(user.id)) {
      throw new BadRequestException({
        code: ERROR_CODES.INSUFFICIENT_BALANCE,
        message: 'You do not have enough balance. Please recharge your wallet.',
      });
    }

    const connection = this.providersService.getActiveAmazonFlex(user.id);
    if (!connection) {
      throw new BadRequestException('Connect your Amazon Flex account first');
    }

    const filter = this.filtersService.get(user.id, filterPresetId);

    const job: BlockJob = {
      id: randomUUID(),
      userId: user.id,
      filterPresetId,
      status: BLOCK_JOB_STATUS.RUNNING,
      startedAt: new Date().toISOString(),
      pollCount: 0,
    };
    this.store.blockJobs.set(job.id, job);
    this.blockEngine.startJob(job, filter);
    return job;
  }

  stop(userId: string, id: string): BlockJob {
    const job = this.get(userId, id);
    if (job.status === BLOCK_JOB_STATUS.RUNNING) {
      job.status = BLOCK_JOB_STATUS.STOPPED;
      job.stoppedAt = new Date().toISOString();
      this.store.blockJobs.set(id, job);
      this.blockEngine.stopLoop(id);
    }
    return job;
  }

  refund(userId: string, id: string): BlockJob {
    const job = this.get(userId, id);
    if (job.grabbedBlock?.status === 'ACTIVE') {
      this.walletService.refund(userId, id);
      job.grabbedBlock.status = 'CANCELLED';
      this.store.blockJobs.set(id, job);
    }
    return job;
  }
}
