import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { ApiResult } from '@thunder-spark/shared';

/** Set EXPO_PUBLIC_API_URL in apps/mobile/.env (use your PC LAN IP for phone testing). */
function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const extra = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  if (extra) return extra.replace(/\/$/, '');

  if (Platform.OS === 'web') return 'http://localhost:3000/api/v1';

  // Physical device cannot reach localhost — fallback shown in UI if requests fail
  return 'http://10.75.166.253:3000/api/v1';
}

export const API_URL = resolveApiUrl();

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(`${API_URL}${path}`, { ...options, headers });
    return (await response.json()) as ApiResult<T>;
  } catch {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: `Cannot reach API at ${API_URL}. Start the backend and set EXPO_PUBLIC_API_URL to your PC LAN IP.`,
      },
    };
  }
}

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
