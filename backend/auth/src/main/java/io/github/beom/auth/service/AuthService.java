package io.github.beom.auth.service;

import io.github.beom.auth.domain.RefreshToken;
import io.github.beom.auth.domain.TokenPair;
import io.github.beom.auth.oauth.OAuthUserInfo;
import io.github.beom.auth.oauth.OAuthVerifier;
import io.github.beom.auth.oauth.OAuthVerifierFactory;
import io.github.beom.auth.repository.RedisTokenRepository;
import io.github.beom.auth.util.JwtUtil;
import io.github.beom.user.domain.User;
import io.github.beom.user.domain.UserOAuth;
import io.github.beom.user.domain.vo.Email;
import io.github.beom.user.domain.vo.Nickname;
import io.github.beom.user.domain.vo.OAuthProvider;
import io.github.beom.user.repository.UserOAuthRepository;
import io.github.beom.user.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 인증 비즈니스 로직 서비스. 소셜 로그인, 토큰 갱신, 로그아웃 처리. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

  private final UserRepository userRepository;
  private final UserOAuthRepository userOAuthRepository;
  private final JwtUtil jwtUtil;
  private final RedisTokenRepository tokenRepository;
  private final OAuthVerifierFactory oAuthVerifierFactory;

  /** 소셜 로그인. 토큰 검증 후 신규 사용자는 자동 가입, 기존 사용자는 토큰 발급. */
  @Transactional
  public TokenPair oAuthLogin(OAuthProvider provider, String token, String deviceId) {
    // 1. OAuth 토큰 검증 및 사용자 정보 추출
    OAuthVerifier verifier = oAuthVerifierFactory.getVerifier(provider);
    OAuthUserInfo userInfo = verifier.verify(token);

    // 2. 기존 OAuth 연동 확인
    Optional<UserOAuth> existingOAuth =
        userOAuthRepository.findByProviderAndProviderId(provider, userInfo.providerId());

    User user;

    if (existingOAuth.isPresent()) {
      UserOAuth oAuth = existingOAuth.get();
      if (oAuth.isUnlinked()) {
        throw new IllegalStateException("연동 해제된 계정입니다. 다시 연동해주세요");
      }

      user =
          userRepository
              .findById(oAuth.getUserId())
              .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다"));
    } else {
      // 3. 이메일로 기존 사용자 확인 또는 신규 생성
      Optional<User> existingUser =
          userInfo.email() != null ? userRepository.findByEmail(userInfo.email()) : Optional.empty();

      if (existingUser.isPresent()) {
        user = existingUser.get();
      } else {
        String nickname =
            userInfo.name() != null ? userInfo.name() : generateNickname(userInfo.email());
        user =
            User.createOAuthUser(
                userInfo.email() != null ? new Email(userInfo.email()) : null,
                new Nickname(nickname));
        user = userRepository.save(user);
      }

      // 4. OAuth 연동 정보 저장
      UserOAuth newOAuth = UserOAuth.create(user.getId(), provider, userInfo.providerId());
      userOAuthRepository.save(newOAuth);
    }

    if (!user.canLogin()) {
      throw new IllegalStateException("로그인할 수 없는 계정입니다");
    }

    return generateAndSaveTokens(user, deviceId);
  }

  /** 토큰 갱신. Redis 저장된 토큰과 비교 후 새 토큰 쌍 발급. 토큰 탈취 감지 시 전체 로그아웃. */
  @Transactional
  public TokenPair refresh(String refreshToken, String deviceId) {
    JwtUtil.Claims claims = jwtUtil.parseRefreshToken(refreshToken);

    RefreshToken storedToken =
        tokenRepository
            .findRefreshToken(claims.userId(), deviceId)
            .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 리프레시 토큰입니다"));

    if (!storedToken.getToken().equals(refreshToken)) {
      tokenRepository.deleteAllRefreshTokens(claims.userId());
      throw new IllegalArgumentException("토큰이 탈취되었을 수 있습니다. 모든 세션이 로그아웃됩니다");
    }

    if (storedToken.isExpired()) {
      tokenRepository.deleteRefreshToken(claims.userId(), deviceId);
      throw new IllegalArgumentException("리프레시 토큰이 만료되었습니다. 다시 로그인해주세요");
    }

    User user =
        userRepository
            .findById(claims.userId())
            .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

    if (!user.canLogin()) {
      tokenRepository.deleteAllRefreshTokens(user.getId());
      throw new IllegalStateException("로그인할 수 없는 계정입니다");
    }

    return generateAndSaveTokens(user, deviceId);
  }

  /** 로그아웃. 해당 기기의 Refresh Token 삭제. */
  public void logout(Long userId, String deviceId) {
    tokenRepository.deleteRefreshToken(userId, deviceId);
  }

  /** 모든 기기 로그아웃. 사용자의 모든 Refresh Token 삭제. */
  public void logoutAllDevices(Long userId) {
    tokenRepository.deleteAllRefreshTokens(userId);
  }

  /** Access Token 검증. Gateway에서 호출. */
  public TokenInfo validateToken(String accessToken) {
    JwtUtil.Claims claims = jwtUtil.parseAccessToken(accessToken);
    return new TokenInfo(claims.userId(), claims.email(), claims.role());
  }

  /** 토큰 쌍 생성 후 Redis에 Refresh Token 저장. */
  private TokenPair generateAndSaveTokens(User user, String deviceId) {
    TokenPair tokenPair =
        jwtUtil.generateTokenPair(user.getId(), user.getEmail().value(), user.getRole().name());

    RefreshToken refreshToken =
        RefreshToken.create(
            tokenPair.getRefreshToken(),
            user.getId(),
            deviceId,
            LocalDateTime.now().plusSeconds(jwtUtil.getRefreshTokenExpirationSeconds()));

    tokenRepository.saveRefreshToken(refreshToken);

    return tokenPair;
  }

  private String generateNickname(String email) {
    if (email == null || !email.contains("@")) {
      return "user_" + System.currentTimeMillis();
    }
    return email.split("@")[0];
  }

  public record TokenInfo(Long userId, String email, String role) {}
}
