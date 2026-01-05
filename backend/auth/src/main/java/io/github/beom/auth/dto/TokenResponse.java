package io.github.beom.auth.dto;

import io.github.beom.auth.domain.TokenPair;

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
