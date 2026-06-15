import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  BlockJob,
  FilterPreset,
  ProviderConnection,
  User,
  Wallet,
  WalletTransaction,
} from '@thunder-spark/shared';

interface StoredUser extends User {
  passwordHash: string;
}

@Injectable()
export class InMemoryStore {
  users = new Map<string, StoredUser>();
  usersByEmail = new Map<string, string>();
  filters = new Map<string, FilterPreset>();
  wallets = new Map<string, Wallet>();
  walletTxns = new Map<string, WalletTransaction[]>();
  providerConnections = new Map<string, ProviderConnection>();
  blockJobs = new Map<string, BlockJob>();
  refreshTokens = new Map<string, string>();
  processedPaymentIds = new Set<string>();

  createUser(email: string, name: string, passwordHash: string): User {
    const id = randomUUID();
    const user: StoredUser = {
      id,
      email,
      name,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    this.users.set(id, user);
    this.usersByEmail.set(email.toLowerCase(), id);
    this.wallets.set(id, { userId: id, balanceCents: 0, currency: 'USD' });
    this.walletTxns.set(id, []);
    return this.toPublicUser(user);
  }

  findUserByEmail(email: string): StoredUser | undefined {
    const id = this.usersByEmail.get(email.toLowerCase());
    return id ? this.users.get(id) : undefined;
  }

  findUserById(id: string): StoredUser | undefined {
    return this.users.get(id);
  }

  toPublicUser(user: StoredUser): User {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    };
  }
}
