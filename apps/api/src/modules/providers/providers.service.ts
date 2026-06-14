import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { ProviderConnection, User } from '@thunder-spark/shared';
import { PROVIDERS, providerConnectSchema } from '@thunder-spark/shared';
import { InMemoryStore } from '../../store/in-memory.store';

@Injectable()
export class ProvidersService {
  constructor(private readonly store: InMemoryStore) {}

  list(userId: string): ProviderConnection[] {
    return [...this.store.providerConnections.values()].filter((c) => c.userId === userId);
  }

  connect(user: User, body: unknown): ProviderConnection {
    const input = providerConnectSchema.parse(body);

    if (input.provider !== PROVIDERS.AMAZON_FLEX) {
      throw new BadRequestException(`${input.provider} integration coming soon`);
    }

    const connection: ProviderConnection = {
      id: randomUUID(),
      userId: user.id,
      provider: input.provider,
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
      connectedAt: new Date().toISOString(),
    };
    this.store.providerConnections.set(connection.id, connection);
    return connection;
  }

  getActiveAmazonFlex(userId: string): ProviderConnection | undefined {
    return [...this.store.providerConnections.values()].find(
      (c) => c.userId === userId && c.provider === PROVIDERS.AMAZON_FLEX && c.status === 'ACTIVE',
    );
  }
}
