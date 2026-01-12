import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';
import Config from 'react-native-config';
import {showErrorToast} from '../utils/toast';

// API Base URL (.env의 API_URL 사용)
const API_BASE_URL = `${Config.API_URL}/api/v1.0`;

// 토큰 저장 키
const ACCESS_TOKEN_KEY = '@tymee_access_token';
const REFRESH_TOKEN_KEY = '@tymee_refresh_token';

// 토큰 관리 함수
export const tokenManager = {
  async getAccessToken(): Promise<string | null> {
    return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  },

  async getRefreshToken(): Promise<string | null> {
    return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  },

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await AsyncStorage.multiSet([
      [ACCESS_TOKEN_KEY, accessToken],
      [REFRESH_TOKEN_KEY, refreshToken],
    ]);
  },

  async clearTokens(): Promise<void> {
    await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
  },
};

// API 응답 타입
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

// HTTP 에러 클래스
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    showToast = true,
  ) {
    super(message);
    this.name = 'ApiError';

    // 전역 에러 토스트 표시 (401은 로그인 화면으로 이동하므로 제외)
    if (showToast && status !== 401) {
      showErrorToast(message);
    }
  }
}

// API 클라이언트
class ApiClient {
  private baseURL: string;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private subscribeTokenRefresh(cb: (token: string) => void) {
    this.refreshSubscribers.push(cb);
  }

  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  private async refreshAccessToken(): Promise<string | null> {
    const refreshToken = await tokenManager.getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    try {
      const deviceId = await this.getDeviceId();
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({refreshToken, deviceId}),
      });

      if (!response.ok) {
        await tokenManager.clearTokens();
        return null;
      }

      const result: ApiResponse<{
        accessToken: string;
        refreshToken: string;
      }> = await response.json();

      if (result.success && result.data) {
        await tokenManager.setTokens(
          result.data.accessToken,
          result.data.refreshToken,
        );
        return result.data.accessToken;
      }

      return null;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await tokenManager.clearTokens();
      return null;
    }
  }

  async getDeviceId(): Promise<string> {
    // 실제 앱에서는 react-native-device-info 사용 권장
    let deviceId = await AsyncStorage.getItem('@tymee_device_id');
    if (!deviceId) {
      deviceId = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem('@tymee_device_id', deviceId);
    }
    return deviceId;
  }

  private async request<T>(
    method: string,
    url: string,
    data?: unknown,
    requireAuth = true,
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (requireAuth) {
      let accessToken = await tokenManager.getAccessToken();

      if (!accessToken && this.isRefreshing) {
        // 토큰 갱신 중이면 대기
        accessToken = await new Promise<string>((resolve) => {
          this.subscribeTokenRefresh(resolve);
        });
      }

      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }

    let response = await fetch(`${this.baseURL}${url}`, config);

    // 401 에러시 토큰 갱신 시도
    if (response.status === 401 && requireAuth) {
      if (!this.isRefreshing) {
        this.isRefreshing = true;
        const newToken = await this.refreshAccessToken();
        this.isRefreshing = false;

        if (newToken) {
          this.onTokenRefreshed(newToken);
          headers.Authorization = `Bearer ${newToken}`;
          response = await fetch(`${this.baseURL}${url}`, {
            ...config,
            headers,
          });
        } else {
          throw new ApiError(401, 'UNAUTHORIZED', '인증이 만료되었습니다.');
        }
      } else {
        // 이미 갱신 중이면 대기 후 재시도
        const newToken = await new Promise<string>((resolve) => {
          this.subscribeTokenRefresh(resolve);
        });
        headers.Authorization = `Bearer ${newToken}`;
        response = await fetch(`${this.baseURL}${url}`, {...config, headers});
      }
    }

    // 204 No Content 또는 빈 응답 처리
    const contentLength = response.headers.get('content-length');
    const hasBody = contentLength !== '0' && response.status !== 204;

    if (!hasBody) {
      if (!response.ok) {
        throw new ApiError(response.status, 'REQUEST_FAILED', '요청에 실패했습니다.');
      }
      return undefined as T;
    }

    const result: ApiResponse<T> = await response.json();

    console.log(`[API] Response for ${url}:`, JSON.stringify(result, null, 2));

    if (!response.ok || !result.success) {
      console.error(`[API] Error - status: ${response.status}, error:`, result.error);
      throw new ApiError(
        response.status,
        result.error?.code || 'UNKNOWN_ERROR',
        result.error?.message || '알 수 없는 오류가 발생했습니다.',
      );
    }

    return result.data;
  }

  // Public methods
  async get<T>(url: string, requireAuth = true): Promise<T> {
    return this.request<T>('GET', url, undefined, requireAuth);
  }

  async post<T>(url: string, data?: unknown, requireAuth = true): Promise<T> {
    return this.request<T>('POST', url, data, requireAuth);
  }

  async put<T>(url: string, data?: unknown, requireAuth = true): Promise<T> {
    return this.request<T>('PUT', url, data, requireAuth);
  }

  async patch<T>(url: string, data?: unknown, requireAuth = true): Promise<T> {
    return this.request<T>('PATCH', url, data, requireAuth);
  }

  async delete<T>(url: string, requireAuth = true): Promise<T> {
    return this.request<T>('DELETE', url, undefined, requireAuth);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
