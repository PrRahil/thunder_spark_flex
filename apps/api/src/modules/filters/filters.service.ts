import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { FilterPreset, User } from '@thunder-spark/shared';
import { filterPresetSchema } from '@thunder-spark/shared';
import { InMemoryStore } from '../../store/in-memory.store';

@Injectable()
export class FiltersService {
  constructor(private readonly store: InMemoryStore) {}

  list(userId: string): FilterPreset[] {
    return [...this.store.filters.values()].filter((f) => f.userId === userId);
  }

  get(userId: string, id: string): FilterPreset {
    const preset = this.store.filters.get(id);
    if (!preset || preset.userId !== userId) {
      throw new NotFoundException('Filter preset not found');
    }
    return preset;
  }

  create(user: User, body: unknown): FilterPreset {
    const input = filterPresetSchema.parse(body);
    const now = new Date().toISOString();
    const preset: FilterPreset = {
      id: randomUUID(),
      userId: user.id,
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    this.store.filters.set(preset.id, preset);
    return preset;
  }

  update(userId: string, id: string, body: unknown): FilterPreset {
    const existing = this.get(userId, id);
    const input = filterPresetSchema.parse(body);
    const updated: FilterPreset = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };
    this.store.filters.set(id, updated);
    return updated;
  }

  remove(userId: string, id: string): void {
    this.get(userId, id);
    this.store.filters.delete(id);
  }
}
