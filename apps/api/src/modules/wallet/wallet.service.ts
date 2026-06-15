import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { User, Wallet, WalletTransaction } from '@thunder-spark/shared';
import {
  ERROR_CODES,
  MIN_WALLET_BALANCE_CENTS,
  SERVICE_FEE_CENTS,
  WALLET_TXN_TYPE,
  walletRechargeSchema,
} from '@thunder-spark/shared';
import { InMemoryStore } from '../../store/in-memory.store';

@Injectable()
export class WalletService {
  constructor(private readonly store: InMemoryStore) {}

  getWallet(userId: string): Wallet {
    const wallet = this.store.wallets.get(userId);
    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }
    return wallet;
  }

  getTransactions(userId: string): WalletTransaction[] {
    return this.store.walletTxns.get(userId) ?? [];
  }

  hasSufficientBalance(userId: string): boolean {
    const wallet = this.getWallet(userId);
    return wallet.balanceCents >= MIN_WALLET_BALANCE_CENTS;
  }

  recharge(user: User, body: unknown): { wallet: Wallet; transaction: WalletTransaction } {
    const { amountCents } = walletRechargeSchema.parse(body);
    const wallet = this.getWallet(user.id);
    wallet.balanceCents += amountCents;
    const transaction = this.recordTxn(user.id, {
      type: WALLET_TXN_TYPE.CREDIT,
      amountCents,
      description: 'Wallet recharge (dev stub)',
      referenceType: 'DEV_STUB',
      referenceId: randomUUID(),
    });
    return { wallet, transaction };
  }

  creditFromPayment(
    userId: string,
    amountCents: number,
    partial: { referenceType: string; referenceId: string; description: string },
  ): WalletTransaction | null {
    const idempotencyKey = `${partial.referenceType}:${partial.referenceId}`;
    if (this.store.processedPaymentIds.has(idempotencyKey)) {
      return null;
    }
    this.store.processedPaymentIds.add(idempotencyKey);

    const wallet = this.getWallet(userId);
    wallet.balanceCents += amountCents;
    return this.recordTxn(userId, {
      type: WALLET_TXN_TYPE.CREDIT,
      amountCents,
      description: partial.description,
      referenceType: partial.referenceType,
      referenceId: partial.referenceId,
    });
  }

  chargeServiceFee(userId: string, blockJobId: string): WalletTransaction {
    const wallet = this.getWallet(userId);
    if (wallet.balanceCents < SERVICE_FEE_CENTS) {
      throw new BadRequestException({
        code: ERROR_CODES.INSUFFICIENT_BALANCE,
        message: 'You do not have enough balance. Please recharge your wallet.',
      });
    }
    wallet.balanceCents -= SERVICE_FEE_CENTS;
    return this.recordTxn(userId, {
      type: WALLET_TXN_TYPE.DEBIT,
      amountCents: SERVICE_FEE_CENTS,
      description: 'Block grab service fee',
      referenceType: 'BLOCK_JOB',
      referenceId: blockJobId,
    });
  }

  refund(userId: string, blockJobId: string): WalletTransaction {
    const wallet = this.getWallet(userId);
    wallet.balanceCents += SERVICE_FEE_CENTS;
    return this.recordTxn(userId, {
      type: WALLET_TXN_TYPE.REFUND,
      amountCents: SERVICE_FEE_CENTS,
      description: 'Refund for cancelled block',
      referenceType: 'BLOCK_JOB',
      referenceId: blockJobId,
    });
  }

  private recordTxn(
    userId: string,
    partial: Omit<WalletTransaction, 'id' | 'userId' | 'createdAt'>,
  ): WalletTransaction {
    const txn: WalletTransaction = {
      id: randomUUID(),
      userId,
      createdAt: new Date().toISOString(),
      ...partial,
    };
    const list = this.store.walletTxns.get(userId) ?? [];
    list.unshift(txn);
    this.store.walletTxns.set(userId, list);
    return txn;
  }
}
