package io.github.beom.auth.domain;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

/** Refresh Token 도메인. Redis에 저장되며 기기별로 관리된다. */
@Getter
public class RefreshToken {

  private final String token;
  private final Long userId;
  private final String deviceId;
  private final LocalDateTime expiresAt;
  private final LocalDateTime createdAt;

  @Builder
  private RefreshToken(
      String token,
      Long userId,
      String deviceId,
      LocalDateTime expiresAt,
      LocalDateTime createdAt) {
    this.token = token;
    this.userId = userId;
    this.deviceId = deviceId;
    this.expiresAt = expiresAt;
    this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
  }

  public static RefreshToken create(
      String token, Long userId, String deviceId, LocalDateTime expiresAt) {
    return RefreshToken.builder()
        .token(token)
        .userId(userId)
        .deviceId(deviceId)
        .expiresAt(expiresAt)
        .build();
  }

  public boolean isExpired() {
    return LocalDateTime.now().isAfter(this.expiresAt);
  }

  public boolean isValid() {
    return !isExpired();
  }

  public long getTtlSeconds() {
    return java.time.Duration.between(LocalDateTime.now(), this.expiresAt).getSeconds();
  }
}
