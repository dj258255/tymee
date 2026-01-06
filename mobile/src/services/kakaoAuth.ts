import {login, logout, getProfile} from '@react-native-seoul/kakao-login';

export interface KakaoAuthResult {
  accessToken: string;
  user: {
    id: string;
    email: string | null;
    nickname: string | null;
    profileImage: string | null;
  };
}

/** 카카오 로그인 수행. */
export const signInWithKakao = async (): Promise<KakaoAuthResult | null> => {
  try {
    const tokenResult = await login();

    if (!tokenResult.accessToken) {
      console.log('카카오 accessToken이 없습니다');
      return null;
    }

    // 프로필 정보 가져오기
    const profile = await getProfile();

    return {
      accessToken: tokenResult.accessToken,
      user: {
        id: String(profile.id),
        email: profile.email ?? null,
        nickname: profile.nickname ?? null,
        profileImage: profile.profileImageUrl ?? null,
      },
    };
  } catch (error: any) {
    if (error.code === 'E_CANCELLED_OPERATION') {
      console.log('카카오 로그인 취소됨');
    } else {
      console.error('카카오 로그인 에러:', error);
    }
    return null;
  }
};

/** 카카오 로그아웃. */
export const signOutKakao = async (): Promise<void> => {
  try {
    await logout();
  } catch (error) {
    console.error('카카오 로그아웃 에러:', error);
  }
};
