package io.github.beom.auth.repository;

import io.github.beom.auth.domain.RefreshToken;
import java.time.Duration;
import java.util.Optional;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;

/** Refresh Token Redis 저장소. 기기별 토큰 관리 및 TTL 자동 만료. */
@Repository
@RequiredArgsConstructor
public class RedisTokenRepository {

  private static final String REFRESH_TOKEN_PREFIX = "refresh_token:";
  private static final String USER_DEVICES_PREFIX = "user_devices:";

  private final StringRedisTemplate redisTemplate;

  /** Refresh Token 저장. TTL 설정으로 자동 만료. */
  public void saveRefreshToken(RefreshToken refreshToken) {
    String key = buildRefreshTokenKey(refreshToken.getUserId(), refreshToken.getDeviceId());
    long ttl = refreshToken.getTtlSeconds();

    if (ttl > 0) {
      redisTemplate.opsForValue().set(key, refreshToken.getToken(), Duration.ofSeconds(ttl));

      String userDevicesKey = USER_DEVICES_PREFIX + refreshToken.getUserId();
      redisTemplate.opsForSet().add(userDevicesKey, refreshToken.getDeviceId());
    }
  }

  /** 사용자/기기 기준 Refresh Token 조회. */
  public Optional<RefreshToken> findRefreshToken(Long userId, String deviceId) {
    String key = buildRefreshTokenKey(userId, deviceId);
    String token = redisTemplate.opsForValue().get(key);

    if (token == null) {
      return Optional.empty();
    }

    Long ttl = redisTemplate.getExpire(key);
    if (ttl == null || ttl <= 0) {
      return Optional.empty();
    }

    return Optional.of(
        RefreshToken.builder()
            .token(token)
            .userId(userId)
            .deviceId(deviceId)
            .expiresAt(java.time.LocalDateTime.now().plusSeconds(ttl))
            .build());
  }

  /** 특정 기기의 Refresh Token 삭제. 로그아웃 시 호출. */
  public void deleteRefreshToken(Long userId, String deviceId) {
    String key = buildRefreshTokenKey(userId, deviceId);
    redisTemplate.delete(key);

    String userDevicesKey = USER_DEVICES_PREFIX + userId;
    redisTemplate.opsForSet().remove(userDevicesKey, deviceId);
  }

  /** 사용자의 모든 기기 Refresh Token 삭제. 토큰 탈취 감지 시 호출. */
  public void deleteAllRefreshTokens(Long userId) {
    String userDevicesKey = USER_DEVICES_PREFIX + userId;
    Set<String> deviceIds = redisTemplate.opsForSet().members(userDevicesKey);

    if (deviceIds != null && !deviceIds.isEmpty()) {
      for (String deviceId : deviceIds) {
        String key = buildRefreshTokenKey(userId, deviceId);
        redisTemplate.delete(key);
      }
    }

    redisTemplate.delete(userDevicesKey);
  }

  private String buildRefreshTokenKey(Long userId, String deviceId) {
    return REFRESH_TOKEN_PREFIX + userId + ":" + deviceId;
  }
}
