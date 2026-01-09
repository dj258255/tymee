import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {tokenManager} from '../services/api';
import * as authService from '../services/authService';
import type {UserInfo, OAuthProvider, UpdateProfileRequest} from '../services/authService';

interface AuthState {
  isLoggedIn: boolean;
  isLoading: boolean;
  user: UserInfo | null;
  error: string | null;

  // 소셜 로그인 (백엔드 연동)
  loginWithOAuth: (
    provider: OAuthProvider,
    token: string,
  ) => Promise<boolean>;

  // 레거시 로그인 (로컬 전용, 테스트용)
  login: (user: {email: string; name: string}) => Promise<void>;

  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  fetchUser: () => Promise<void>;
  clearError: () => void;

  // 프로필 업데이트
  updateProfile: (data: UpdateProfileRequest) => Promise<boolean>;

  // 회원 탈퇴
  withdrawAccount: () => Promise<boolean>;
}

const AUTH_STORAGE_KEY = '@tymee_auth';
const USER_STORAGE_KEY = '@tymee_user';

export const useAuthStore = create<AuthState>((set, get) => ({
  isLoggedIn: false,
  isLoading: true,
  user: null,
  error: null,

  // 소셜 로그인 (백엔드 API 연동)
  loginWithOAuth: async (provider, token) => {
    try {
      set({isLoading: true, error: null});

      // 백엔드로 토큰 전송하여 자체 JWT 발급
      await authService.loginWithOAuth(provider, token);

      // 사용자 정보 조회
      const user = await authService.getCurrentUser();

      // 로컬 저장
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

      set({isLoggedIn: true, user, isLoading: false});
      return true;
    } catch (error: any) {
      console.error('OAuth login failed:', error);
      set({
        isLoading: false,
        error: error.message || '로그인에 실패했습니다.',
      });
      return false;
    }
  },

  // 레거시 로그인 (로컬 저장만, 백엔드 없이 테스트용)
  login: async (userData) => {
    try {
      const user: UserInfo = {
        id: 0,
        nickname: userData.name,
        email: userData.email,
        profileImageId: null,
        bio: null,
        level: null,
        tier: 'elementary',
        totalStudyMinutes: 0,
        status: 'active',
        role: 'user',
        lastLoginAt: null,
        lastActiveAt: null,
        createdAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      set({isLoggedIn: true, user});
    } catch (error) {
      console.error('Failed to save auth state:', error);
    }
  },

  logout: async () => {
    try {
      set({isLoading: true});

      // 백엔드 로그아웃 API 호출 및 토큰 삭제
      await authService.logout();

      // 로컬 저장소 정리
      await AsyncStorage.multiRemove([AUTH_STORAGE_KEY, USER_STORAGE_KEY]);

      set({isLoggedIn: false, user: null, isLoading: false});
    } catch (error) {
      console.error('Failed to logout:', error);
      set({isLoading: false});
    }
  },

  checkAuth: async () => {
    try {
      set({isLoading: true});

      // 저장된 토큰 확인
      const accessToken = await tokenManager.getAccessToken();

      if (accessToken) {
        // 토큰이 있으면 사용자 정보 조회 시도
        try {
          const user = await authService.getCurrentUser();
          await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
          set({isLoggedIn: true, user, isLoading: false});
          return;
        } catch (error) {
          // API 실패시 로컬 저장된 사용자 정보 사용
          const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
          if (userData) {
            const user = JSON.parse(userData) as UserInfo;
            set({isLoggedIn: true, user, isLoading: false});
            return;
          }
        }
      }

      // 토큰 없으면 로컬 저장된 사용자 확인 (레거시 지원)
      const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (userData) {
        const user = JSON.parse(userData) as UserInfo;
        set({isLoggedIn: true, user, isLoading: false});
      } else {
        set({isLoggedIn: false, user: null, isLoading: false});
      }
    } catch (error) {
      console.error('Failed to check auth state:', error);
      set({isLoggedIn: false, user: null, isLoading: false});
    }
  },

  fetchUser: async () => {
    try {
      const user = await authService.getCurrentUser();
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      set({user});
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  },

  clearError: () => {
    set({error: null});
  },

  // 프로필 업데이트 (닉네임, 자기소개)
  updateProfile: async (data) => {
    const {user} = get();
    if (!user?.id) {
      set({error: '로그인이 필요합니다.'});
      return false;
    }

    try {
      set({isLoading: true, error: null});

      const updatedUser = await authService.updateProfile(user.id, data);

      // 로컬 저장소 업데이트
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));

      set({user: updatedUser, isLoading: false});
      return true;
    } catch (error: any) {
      console.error('Profile update failed:', error);
      set({
        isLoading: false,
        error: error.message || '프로필 업데이트에 실패했습니다.',
      });
      return false;
    }
  },

  // 회원 탈퇴
  withdrawAccount: async () => {
    const {user} = get();
    if (!user?.id) {
      set({error: '로그인이 필요합니다.'});
      return false;
    }

    try {
      set({isLoading: true, error: null});

      await authService.withdrawUser(user.id);

      // 로컬 저장소 정리
      await AsyncStorage.multiRemove([AUTH_STORAGE_KEY, USER_STORAGE_KEY]);

      set({isLoggedIn: false, user: null, isLoading: false});
      return true;
    } catch (error: any) {
      console.error('Account withdrawal failed:', error);
      set({
        isLoading: false,
        error: error.message || '회원 탈퇴에 실패했습니다.',
      });
      return false;
    }
  },
}));
