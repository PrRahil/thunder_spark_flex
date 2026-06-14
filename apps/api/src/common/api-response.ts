import type { ApiErrorResponse, ApiResponse } from '@thunder-spark/shared';

export function ok<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

export function fail(code: string, message: string): ApiErrorResponse {
  return { success: false, error: { code, message } };
}
