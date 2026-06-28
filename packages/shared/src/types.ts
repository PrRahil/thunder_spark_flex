import type { BlockJobStatus, ProviderId, WalletTxnType } from './constants';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface TimeRange {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

export interface FilterPreset {
  id: string;
  userId: string;
  name: string;
  dates: string[];
  timeRanges: TimeRange[];
  locations: string[];
  minWageCents?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  userId: string;
  balanceCents: number;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: WalletTxnType;
  amountCents: number;
  description: string;
  referenceType?: string;
  referenceId?: string;
  createdAt: string;
}

export interface ProviderConnection {
  id: string;
  userId: string;
  provider: ProviderId;
  status: 'ACTIVE' | 'EXPIRED' | 'DISCONNECTED';
  expiresAt?: string;
  connectedAt: string;
}

export interface DeliveryBlock {
  id: string;
  provider: ProviderId;
  wageCents: number;
  durationMinutes: number;
  locationName: string;
  startTime: string;
  endTime: string;
  serviceAreaId?: string;
}

export interface BlockJob {
  id: string;
  userId: string;
  filterPresetId: string;
  status: BlockJobStatus;
  startedAt: string;
  stoppedAt?: string;
  grabbedBlock?: GrabbedBlock;
  pollCount?: number;
  lastError?: string;
}

export interface GrabbedBlock {
  id: string;
  blockJobId: string;
  providerBlockId: string;
  wageCents: number;
  locationName: string;
  startTime: string;
  feeChargedCents: number;
  status: 'ACTIVE' | 'CANCELLED' | 'COMPLETED';
}

export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiErrorResponse;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface BlockJobEvent {
  type: 'STATUS' | 'BLOCK_FOUND' | 'BLOCK_GRABBED' | 'ERROR' | 'CAPTCHA';
  jobId: string;
  payload: Record<string, unknown>;
  timestamp: string;
}
