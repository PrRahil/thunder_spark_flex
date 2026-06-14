import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { DeliveryBlock, ProviderConnection } from '@thunder-spark/shared';
import { PROVIDERS } from '@thunder-spark/shared';
import type { AcceptResult, IProviderAdapter } from '@thunder-spark/provider-core';

/** Stub adapter — replace with reverse-engineered Amazon Flex API in Phase 7. */
@Injectable()
export class AmazonFlexAdapter implements IProviderAdapter {
  readonly providerId = PROVIDERS.AMAZON_FLEX;

  async validateSession(connection: ProviderConnection): Promise<boolean> {
    if (connection.status !== 'ACTIVE') return false;
    if (connection.expiresAt && new Date(connection.expiresAt) < new Date()) return false;
    return true;
  }

  async listAvailableBlocks(_connection: ProviderConnection): Promise<DeliveryBlock[]> {
    // Simulated blocks for development
    const now = Date.now();
    return [
      {
        id: randomUUID(),
        provider: PROVIDERS.AMAZON_FLEX,
        wageCents: 25000,
        durationMinutes: 240,
        locationName: 'DSE2 - Downtown',
        startTime: new Date(now + 3600_000).toISOString(),
        endTime: new Date(now + 3600_000 + 4 * 3600_000).toISOString(),
        serviceAreaId: 'DSE2',
      },
      {
        id: randomUUID(),
        provider: PROVIDERS.AMAZON_FLEX,
        wageCents: 18000,
        durationMinutes: 180,
        locationName: 'DSE4 - Suburban',
        startTime: new Date(now + 7200_000).toISOString(),
        endTime: new Date(now + 7200_000 + 3 * 3600_000).toISOString(),
        serviceAreaId: 'DSE4',
      },
    ];
  }

  async acceptBlock(_connection: ProviderConnection, blockId: string): Promise<AcceptResult> {
    return { success: true, blockId };
  }
}
