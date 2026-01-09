import apiClient, {tokenManager} from './api';

/**
 * JWT 토큰에서 payload 추출 (디코딩)
 */
const decodeJwt = (token: string): Record<string, any> | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('JWT decode failed:', error);
    return null;
  }
};

/**
 * 저장된 토큰에서 userId 추출
 */
export const getUserIdFromToken = async (): Promise<number | null> => {
  const accessToken = await tokenManager.getAccessToken();
  console.log('[Auth] Access token exists:', !!accessToken);
  if (!accessToken) {
    return null;
  }
  const payload = decodeJwt(accessToken);
  console.log('[Auth] JWT payload:', payload);
  // userId 또는 sub 필드에서 추출 (숫자로 변환)
  const userId = payload?.userId || payload?.sub;
  return userId ? Number(userId) : null;
};

// 토큰 응답 타입
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
}

// 사용자 정보 타입
export interface UserInfo {
  id: number;
  email: string | null;
  nickname: string;
  profileImageId: number | null;
  bio: string | null;
  level: number | null;
  tier: string;
  totalStudyMinutes: number;
  status: string;
  role: string;
  lastLoginAt: string | null;
  lastActiveAt: string | null;
  createdAt: string;
}

// OAuth 제공자 타입
export type OAuthProvider = 'google' | 'apple' | 'kakao';

/**
 * 소셜 로그인 - 백엔드 API 호출
 * @param provider OAuth 제공자 (google, apple, kakao)
 * @param token OAuth 토큰 (Google/Apple: idToken, Kakao: accessToken)
 */
export const loginWithOAuth = async (
  provider: OAuthProvider,
  token: string,
): Promise<TokenResponse> => {
  const deviceId = await apiClient.getDeviceId();

  console.log(`[Auth] Attempting ${provider} login with deviceId: ${deviceId}`);

  const response = await apiClient.post<TokenResponse>(
    `/auth/login/${provider}`,
    {token, deviceId},
    false, // 로그인이므로 인증 불필요
  );

  console.log('[Auth] Login response:', response);

  // 토큰 저장
  await tokenManager.setTokens(response.accessToken, response.refreshToken);

  console.log('[Auth] Tokens saved successfully');

  return response;
};

/**
 * 현재 로그인한 사용자 정보 조회
 */
export const getCurrentUser = async (): Promise<UserInfo> => {
  const userId = await getUserIdFromToken();
  console.log('[Auth] Extracted userId from token:', userId);
  if (!userId) {
    throw new Error('로그인이 필요합니다.');
  }
  const user = await apiClient.get<UserInfo>(`/users/${userId}`);
  console.log('[Auth] User info:', user);
  return user;
};

/**
 * 로그아웃
 */
export const logout = async (): Promise<void> => {
  try {
    const deviceId = await apiClient.getDeviceId();
    await apiClient.post<void>(`/auth/logout?deviceId=${deviceId}`);
  } catch (error) {
    console.error('Logout API failed:', error);
  } finally {
    // 로컬 토큰 삭제는 항상 수행
    await tokenManager.clearTokens();
  }
};

/**
 * 토큰 갱신
 */
export const refreshToken = async (): Promise<TokenResponse | null> => {
  const currentRefreshToken = await tokenManager.getRefreshToken();
  if (!currentRefreshToken) {
    return null;
  }

  try {
    const deviceId = await apiClient.getDeviceId();
    const response = await apiClient.post<TokenResponse>(
      '/auth/refresh',
      {refreshToken: currentRefreshToken, deviceId},
      false,
    );

    await tokenManager.setTokens(response.accessToken, response.refreshToken);
    return response;
  } catch (error) {
    console.error('Token refresh failed:', error);
    await tokenManager.clearTokens();
    return null;
  }
};

/**
 * 로그인 상태 확인
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const accessToken = await tokenManager.getAccessToken();
  return !!accessToken;
};

/**
 * 프로필 업데이트 요청 타입
 */
export interface UpdateProfileRequest {
  nickname?: string;
  bio?: string;
}

/**
 * 프로필 업데이트
 * @param userId 사용자 ID
 * @param data 업데이트할 데이터 (nickname, bio)
 */
export const updateProfile = async (
  userId: number,
  data: UpdateProfileRequest,
): Promise<UserInfo> => {
  return apiClient.patch<UserInfo>(`/users/${userId}`, data);
};

/**
 * 닉네임 중복 확인
 * @param nickname 확인할 닉네임
 * @returns true면 이미 존재하는 닉네임
 */
export const checkNickname = async (nickname: string): Promise<boolean> => {
  return apiClient.get<boolean>(`/users/check-nickname?nickname=${encodeURIComponent(nickname)}`, false);
};

/**
 * 회원 탈퇴
 * @param userId 탈퇴할 사용자 ID
 */
export const withdrawUser = async (userId: number): Promise<void> => {
  await apiClient.delete<void>(`/users/${userId}`);
  await tokenManager.clearTokens();
};
