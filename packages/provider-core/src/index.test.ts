import type { DeliveryBlock, FilterPreset } from '@thunder-spark/shared';
import { describe, expect, it } from 'vitest';
import { pickBestBlock, scoreBlock } from './index';

const baseFilter: FilterPreset = {
  id: 'filter-1',
  userId: 'user-1',
  name: 'Weekday mornings',
  dates: ['2026-06-28'],
  timeRanges: [{ startHour: 8, startMinute: 0, endHour: 12, endMinute: 0 }],
  locations: ['Seattle'],
  minWageCents: 8000,
  createdAt: '2026-06-28T00:00:00.000Z',
  updatedAt: '2026-06-28T00:00:00.000Z',
};

function makeBlock(overrides: Partial<DeliveryBlock> = {}): DeliveryBlock {
  return {
    id: 'block-1',
    provider: 'AMAZON_FLEX',
    wageCents: 9000,
    durationMinutes: 180,
    locationName: 'Seattle DSE5',
    startTime: '2026-06-28T09:00:00.000Z',
    endTime: '2026-06-28T12:00:00.000Z',
    ...overrides,
  };
}

describe('scoreBlock', () => {
  it('adds bonuses when block matches date, location, time, and min wage', () => {
    const localStart = new Date(2026, 5, 28, 9, 0, 0);
    const block = makeBlock({
      startTime: localStart.toISOString(),
      endTime: new Date(2026, 5, 28, 12, 0, 0).toISOString(),
    });
    const score = scoreBlock(block, baseFilter);

    expect(score).toBe(9000 + 5000 + 3000 + 2000 + 1000);
  });

  it('uses wage only when nothing matches the filter', () => {
    const block = makeBlock({
      wageCents: 7000,
      locationName: 'Portland',
      startTime: '2026-07-01T18:00:00.000Z',
      endTime: '2026-07-01T21:00:00.000Z',
    });

    expect(scoreBlock(block, baseFilter)).toBe(7000);
  });
});

describe('pickBestBlock', () => {
  it('returns null for an empty list', () => {
    expect(pickBestBlock([], baseFilter)).toBeNull();
  });

  it('returns the highest-scoring block', () => {
    const low = makeBlock({ id: 'low', wageCents: 7000, locationName: 'Portland' });
    const high = makeBlock({ id: 'high', wageCents: 12000 });

    expect(pickBestBlock([low, high], baseFilter)?.id).toBe('high');
  });
});
