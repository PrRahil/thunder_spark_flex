import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema, walletRechargeSchema } from './schemas';

describe('registerSchema', () => {
  it('accepts valid registration input', () => {
    const result = registerSchema.safeParse({
      email: 'driver@example.com',
      password: 'password123',
      name: 'Alex Driver',
    });

    expect(result.success).toBe(true);
  });

  it('rejects short passwords', () => {
    const result = registerSchema.safeParse({
      email: 'driver@example.com',
      password: 'short',
      name: 'Alex Driver',
    });

    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('accepts valid login input', () => {
    const result = loginSchema.safeParse({
      email: 'driver@example.com',
      password: 'password123',
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid email addresses', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    });

    expect(result.success).toBe(false);
  });
});

describe('walletRechargeSchema', () => {
  it('accepts amounts within allowed range', () => {
    const result = walletRechargeSchema.safeParse({ amountCents: 5000 });

    expect(result.success).toBe(true);
  });

  it('rejects amounts below minimum recharge', () => {
    const result = walletRechargeSchema.safeParse({ amountCents: 100 });

    expect(result.success).toBe(false);
  });
});
