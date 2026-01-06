import appleAuth from '@invertase/react-native-apple-authentication';

export interface AppleAuthResult {
  idToken: string;
  user: {
    id: string;
    email: string | null;
    name: string | null;
  };
}

/** Apple 로그인 수행. iOS에서만 동작. */
export const signInWithApple = async (): Promise<AppleAuthResult | null> => {
  try {
    const appleAuthRequestResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    });

    const credentialState = await appleAuth.getCredentialStateForUser(
      appleAuthRequestResponse.user,
    );

    if (credentialState !== appleAuth.State.AUTHORIZED) {
      console.log('Apple 로그인 인증 실패');
      return null;
    }

    const {identityToken, user, email, fullName} = appleAuthRequestResponse;

    if (!identityToken) {
      console.log('Apple identityToken이 없습니다');
      return null;
    }

    // fullName은 첫 로그인에만 제공됨
    const name = fullName
      ? `${fullName.familyName ?? ''}${fullName.givenName ?? ''}`.trim()
      : null;

    return {
      idToken: identityToken,
      user: {
        id: user,
        email: email,
        name: name || null,
      },
    };
  } catch (error: any) {
    if (error.code === appleAuth.Error.CANCELED) {
      console.log('Apple 로그인 취소됨');
    } else {
      console.error('Apple 로그인 에러:', error);
    }
    return null;
  }
};

/** Apple 로그인 지원 여부 확인. */
export const isAppleAuthSupported = (): boolean => {
  return appleAuth.isSupported;
};
