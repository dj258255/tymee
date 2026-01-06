package io.github.beom.auth.util;

import io.github.beom.auth.domain.TokenPair;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import javax.crypto.SecretKey;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** JWT 토큰 생성 및 파싱 유틸리티. */
@Component
@RequiredArgsConstructor
public class JwtUtil {

  private final JwtProperties jwtProperties;
  private SecretKey secretKey;

  @PostConstruct
  public void init() {
    this.secretKey = Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
  }

  /** Access/Refresh Token 쌍 생성. */
  public TokenPair generateTokenPair(Long userId, String email, String role) {
    long now = System.currentTimeMillis();
    long accessTokenExpiration = now + (jwtProperties.getAccessTokenExpiration() * 1000);
    long refreshTokenExpiration = now + (jwtProperties.getRefreshTokenExpiration() * 1000);

    String accessToken =
        Jwts.builder()
            .subject(String.valueOf(userId))
            .claim("email", email)
            .claim("role", role)
            .claim("type", "access")
            .issuer(jwtProperties.getIssuer())
            .issuedAt(new Date(now))
            .expiration(new Date(accessTokenExpiration))
            .signWith(secretKey)
            .compact();

    String refreshToken =
        Jwts.builder()
            .subject(String.valueOf(userId))
            .claim("type", "refresh")
            .issuer(jwtProperties.getIssuer())
            .issuedAt(new Date(now))
            .expiration(new Date(refreshTokenExpiration))
            .signWith(secretKey)
            .compact();

    return TokenPair.of(
        accessToken,
        refreshToken,
        jwtProperties.getAccessTokenExpiration(),
        jwtProperties.getRefreshTokenExpiration());
  }

  /** Access Token 파싱. 타입 검증 포함. */
  public Claims parseAccessToken(String accessToken) {
    return parseClaims(accessToken, "access");
  }

  /** Refresh Token 파싱. 타입 검증 포함. */
  public Claims parseRefreshToken(String refreshToken) {
    return parseClaims(refreshToken, "refresh");
  }

  public long getAccessTokenExpirationSeconds() {
    return jwtProperties.getAccessTokenExpiration();
  }

  public long getRefreshTokenExpirationSeconds() {
    return jwtProperties.getRefreshTokenExpiration();
  }

  /** 토큰 파싱 및 클레임 추출. 만료/유효하지 않은 토큰은 예외 발생. */
  private Claims parseClaims(String token, String expectedType) {
    try {
      io.jsonwebtoken.Claims jwtClaims =
          Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token).getPayload();

      String type = jwtClaims.get("type", String.class);
      if (!expectedType.equals(type)) {
        throw new IllegalArgumentException("잘못된 토큰 타입입니다");
      }

      Long userId = Long.parseLong(jwtClaims.getSubject());
      String email = jwtClaims.get("email", String.class);
      String role = jwtClaims.get("role", String.class);
      long expiresAt = jwtClaims.getExpiration().getTime();

      return new Claims(userId, email, role, expiresAt);
    } catch (ExpiredJwtException e) {
      throw new IllegalArgumentException("토큰이 만료되었습니다", e);
    } catch (JwtException e) {
      throw new IllegalArgumentException("유효하지 않은 토큰입니다", e);
    }
  }

  public record Claims(Long userId, String email, String role, long expiresAt) {}
}
