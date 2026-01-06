package io.github.beom.auth.oauth;

import io.github.beom.user.domain.vo.OAuthProvider;

/** OAuth 인증 후 반환되는 사용자 정보. */
public record OAuthUserInfo(
    OAuthProvider provider, String providerId, String email, String name, String profileImage) {}
