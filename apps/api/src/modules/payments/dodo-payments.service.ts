import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface DodoCheckoutResult {
  sessionId: string;
  checkoutUrl: string;
}

@Injectable()
export class DodoPaymentsService {
  private readonly logger = new Logger(DodoPaymentsService.name);

  isConfigured(): boolean {
    return Boolean(
      process.env.DODO_PAYMENTS_API_KEY &&
        process.env.DODO_PRODUCT_ID_25 &&
        process.env.DODO_PRODUCT_ID_50 &&
        process.env.DODO_PRODUCT_ID_100,
    );
  }

  getProductIdForAmount(amountCents: number): string | null {
    const map: Record<number, string | undefined> = {
      2500: process.env.DODO_PRODUCT_ID_25,
      5000: process.env.DODO_PRODUCT_ID_50,
      10000: process.env.DODO_PRODUCT_ID_100,
    };
    return map[amountCents] ?? null;
  }

  async createCheckoutSession(input: {
    productId: string;
    userId: string;
    userEmail: string;
    amountCents: number;
  }): Promise<DodoCheckoutResult> {
    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    if (!apiKey) {
      throw new Error('DODO_PAYMENTS_API_KEY is not configured');
    }

    const baseUrl =
      process.env.DODO_PAYMENTS_MODE === 'live'
        ? 'https://live.dodopayments.com'
        : 'https://test.dodopayments.com';

    const returnUrl =
      process.env.DODO_RETURN_URL ?? 'thunder://wallet?status=success';
    const idempotencyKey = randomUUID();

    const body = {
      product_cart: [{ product_id: input.productId, quantity: 1 }],
      customer: { email: input.userEmail },
      metadata: {
        user_id: input.userId,
        amount_cents: String(input.amountCents),
        idempotency_key: idempotencyKey,
        purpose: 'wallet_recharge',
      },
      return_url: returnUrl,
      cancel_url: process.env.DODO_CANCEL_URL ?? 'thunder://wallet?status=cancelled',
    };

    const response = await fetch(`${baseUrl}/checkouts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Dodo checkout failed: ${response.status} ${errorText}`);
      throw new Error('Failed to create payment checkout session');
    }

    const data = (await response.json()) as {
      session_id: string;
      checkout_url?: string | null;
    };

    if (!data.checkout_url) {
      throw new Error('Dodo did not return a checkout URL');
    }

    return { sessionId: data.session_id, checkoutUrl: data.checkout_url };
  }
}
