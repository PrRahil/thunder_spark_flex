import * as SecureStore from 'expo-secure-store';
import type { AuthTokens, User } from '@thunder-spark/shared';
import { setAccessToken } from './api';

const TOKEN_KEY = 'tsf_access_token';
const REFRESH_KEY = 'tsf_refresh_token';
const USER_KEY = 'tsf_user';

export async function saveSession(user: User, tokens: AuthTokens) {
  await SecureStore.setItemAsync(TOKEN_KEY, tokens.accessToken);
  await SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  setAccessToken(tokens.accessToken);
}

export async function loadSession(): Promise<{ user: User; accessToken: string } | null> {
  const accessToken = await SecureStore.getItemAsync(TOKEN_KEY);
  const userJson = await SecureStore.getItemAsync(USER_KEY);
  if (!accessToken || !userJson) return null;
  setAccessToken(accessToken);
  return { user: JSON.parse(userJson) as User, accessToken };
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
  setAccessToken(null);
}
