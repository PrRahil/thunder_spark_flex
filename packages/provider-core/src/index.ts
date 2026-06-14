import type { DeliveryBlock, FilterPreset, ProviderConnection } from '@thunder-spark/shared';

export interface AcceptResult {
  success: boolean;
  blockId: string;
  error?: string;
  captchaRequired?: boolean;
}

export interface IProviderAdapter {
  readonly providerId: string;
  validateSession(connection: ProviderConnection): Promise<boolean>;
  listAvailableBlocks(connection: ProviderConnection): Promise<DeliveryBlock[]>;
  acceptBlock(connection: ProviderConnection, blockId: string): Promise<AcceptResult>;
}

export function scoreBlock(block: DeliveryBlock, filter: FilterPreset): number {
  let score = block.wageCents;

  const blockDate = block.startTime.slice(0, 10);
  if (filter.dates.includes(blockDate)) score += 5000;

  if (filter.locations.some((loc) => block.locationName.toLowerCase().includes(loc.toLowerCase()))) {
    score += 3000;
  }

  const hour = new Date(block.startTime).getHours();
  for (const range of filter.timeRanges) {
    if (hour >= range.startHour && hour <= range.endHour) {
      score += 2000;
      break;
    }
  }

  if (filter.minWageCents && block.wageCents >= filter.minWageCents) {
    score += 1000;
  }

  return score;
}

export function pickBestBlock(
  blocks: DeliveryBlock[],
  filter: FilterPreset,
): DeliveryBlock | null {
  if (blocks.length === 0) return null;
  return blocks.reduce((best, current) =>
    scoreBlock(current, filter) > scoreBlock(best, filter) ? current : best,
  );
}
