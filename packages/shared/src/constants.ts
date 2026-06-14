/** Service fee charged per successfully grabbed block (USD cents). */
export const SERVICE_FEE_CENTS = 900;

/** Minimum wallet balance required to start a block search (USD cents). */
export const MIN_WALLET_BALANCE_CENTS = SERVICE_FEE_CENTS;

export const DEFAULT_CURRENCY = 'USD';

/** Target poll interval for block engine (milliseconds). */
export const BLOCK_POLL_INTERVAL_MS = 50;

/** Max poll interval with jitter (milliseconds). */
export const BLOCK_POLL_INTERVAL_MAX_MS = 150;

export const PROVIDERS = {
  AMAZON_FLEX: 'AMAZON_FLEX',
  UBER: 'UBER',
  ZOMATO: 'ZOMATO',
} as const;

export type ProviderId = (typeof PROVIDERS)[keyof typeof PROVIDERS];

export const BLOCK_JOB_STATUS = {
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  STOPPED: 'STOPPED',
} as const;

export type BlockJobStatus = (typeof BLOCK_JOB_STATUS)[keyof typeof BLOCK_JOB_STATUS];

export const WALLET_TXN_TYPE = {
  CREDIT: 'CREDIT',
  DEBIT: 'DEBIT',
  REFUND: 'REFUND',
  HOLD: 'HOLD',
  RELEASE: 'RELEASE',
} as const;

export type WalletTxnType = (typeof WALLET_TXN_TYPE)[keyof typeof WALLET_TXN_TYPE];

export const ERROR_CODES = {
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  PROVIDER_SESSION_EXPIRED: 'PROVIDER_SESSION_EXPIRED',
  BLOCK_JOB_ALREADY_RUNNING: 'BLOCK_JOB_ALREADY_RUNNING',
  CAPTCHA_REQUIRED: 'CAPTCHA_REQUIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
