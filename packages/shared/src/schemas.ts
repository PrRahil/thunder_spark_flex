import { z } from 'zod';
import { PROVIDERS } from './constants';

export const timeRangeSchema = z.object({
  startHour: z.number().int().min(0).max(23),
  startMinute: z.number().int().min(0).max(59),
  endHour: z.number().int().min(0).max(23),
  endMinute: z.number().int().min(0).max(59),
});

export const filterPresetSchema = z.object({
  name: z.string().min(1).max(100),
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1),
  timeRanges: z.array(timeRangeSchema).min(1),
  locations: z.array(z.string().min(1)).min(1),
  minWageCents: z.number().int().min(0).optional(),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const startBlockJobSchema = z.object({
  filterPresetId: z.string().uuid(),
});

export const walletRechargeSchema = z.object({
  amountCents: z.number().int().min(500).max(50000),
});

export const providerConnectSchema = z.object({
  provider: z.enum([PROVIDERS.AMAZON_FLEX, PROVIDERS.UBER, PROVIDERS.ZOMATO]),
  sessionPayload: z.record(z.unknown()),
});

export type FilterPresetInput = z.infer<typeof filterPresetSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type StartBlockJobInput = z.infer<typeof startBlockJobSchema>;
export type WalletRechargeInput = z.infer<typeof walletRechargeSchema>;
export type ProviderConnectInput = z.infer<typeof providerConnectSchema>;
