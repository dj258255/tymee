import {
  GoogleSignin,
  statusCodes,
  type User,
} from '@react-native-google-signin/google-signin';

// Google Sign-In 초기화
export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    webClientId:
      '527600336182-fv82kmlbp9jabooa0932h4kiudb9441e.apps.googleusercontent.com',
    iosClientId:
      '527600336182-s6ln7vpk5h15d0c11kfrl7vqs4376l14.apps.googleusercontent.com',
    offlineAccess: true,
  });
};

// Google 로그인
export const signInWithGoogle = async (): Promise<{
  idToken: string;
  user: User['data'];
} | null> => {
  try {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();

    if ('data' in response && response.data?.idToken) {
      return {
        idToken: response.data.idToken,
        user: response.data,
      };
    }

    return null;
  } catch (error: any) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      console.log('로그인 취소됨');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      console.log('로그인 진행 중');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      console.log('Play Services 사용 불가');
    } else {
      console.error('Google 로그인 에러:', error);
    }
    return null;
  }
};

// Google 로그아웃
export const signOutGoogle = async (): Promise<void> => {
  try {
    await GoogleSignin.signOut();
  } catch (error) {
    console.error('Google 로그아웃 에러:', error);
  }
};

// 현재 로그인된 사용자 확인
export const getCurrentUser = async (): Promise<User['data'] | null> => {
  try {
    const response = await GoogleSignin.getCurrentUser();
    return response?.data ?? null;
  } catch (error) {
    return null;
  }
};

// 로그인 상태 확인
export const isSignedIn = async (): Promise<boolean> => {
  try {
    return await GoogleSignin.hasPreviousSignIn();
  } catch (error) {
    return false;
  }
};
