package io.github.beom.auth.domain;

import lombok.Builder;
import lombok.Getter;

/** Access Token과 Refresh Token 쌍. 로그인/갱신 시 반환. */
@Getter
public class TokenPair {

  private final String accessToken;
  private final String refreshToken;
  private final long accessTokenExpiresIn;
  private final long refreshTokenExpiresIn;

  @Builder
  private TokenPair(
      String accessToken,
      String refreshToken,
      long accessTokenExpiresIn,
      long refreshTokenExpiresIn) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.accessTokenExpiresIn = accessTokenExpiresIn;
    this.refreshTokenExpiresIn = refreshTokenExpiresIn;
  }

  public static TokenPair of(
      String accessToken,
      String refreshToken,
      long accessTokenExpiresIn,
      long refreshTokenExpiresIn) {
    return TokenPair.builder()
        .accessToken(accessToken)
        .refreshToken(refreshToken)
        .accessTokenExpiresIn(accessTokenExpiresIn)
        .refreshTokenExpiresIn(refreshTokenExpiresIn)
        .build();
  }
}
