package io.github.beom.auth.oauth;

import io.github.beom.user.domain.vo.OAuthProvider;

/** OAuth 토큰 검증 인터페이스. 각 Provider별로 구현. */
public interface OAuthVerifier {

  /** 지원하는 OAuth Provider 반환. */
  OAuthProvider getProvider();

  /** idToken 또는 accessToken을 검증하고 사용자 정보 반환. */
  OAuthUserInfo verify(String token);
}
