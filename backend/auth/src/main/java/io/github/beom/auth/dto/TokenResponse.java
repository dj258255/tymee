package io.github.beom.auth.dto;

import io.github.beom.auth.domain.TokenPair;

/** 토큰 응답 DTO. 로그인/갱신 시 클라이언트에 반환. */
public record TokenResponse(
    String accessToken,
    String refreshToken,
    long accessTokenExpiresIn,
    long refreshTokenExpiresIn) {

  public static TokenResponse from(TokenPair tokenPair) {
    return new TokenResponse(
        tokenPair.getAccessToken(),
        tokenPair.getRefreshToken(),
        tokenPair.getAccessTokenExpiresIn(),
        tokenPair.getRefreshTokenExpiresIn());
  }
}
