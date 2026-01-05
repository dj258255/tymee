package io.github.beom.auth.service;

import io.github.beom.auth.domain.RefreshToken;
import io.github.beom.auth.domain.TokenPair;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

  private final UserRepository userRepository;
  private final UserOAuthRepository userOAuthRepository;
  private final JwtUtil jwtUtil;
  private final RedisTokenRepository tokenRepository;
  private final PasswordEncoder passwordEncoder;

  @Transactional
  public TokenPair login(String email, String password, String deviceId) {
    User user =
        userRepository
            .findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다"));

    if (!user.canLogin()) {
      throw new IllegalStateException("로그인할 수 없는 계정입니다");
    }

    if (user.isOAuthUser()) {
      throw new IllegalArgumentException("소셜 로그인 사용자입니다. 소셜 로그인을 이용해주세요");
    }

    if (!passwordEncoder.matches(password, user.getPassword())) {
      throw new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다");
    }

    return generateAndSaveTokens(user, deviceId);
  }

  @Transactional
  public TokenPair oAuthLogin(
      OAuthProvider provider, String providerId, String email, String nickname, String deviceId) {
    Optional<UserOAuth> existingOAuth =
        userOAuthRepository.findByProviderAndProviderId(provider, providerId);

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
      Optional<User> existingUser = userRepository.findByEmail(email);

      if (existingUser.isPresent()) {
        user = existingUser.get();
      } else {
        String userNickname = nickname != null ? nickname : generateNickname(email);
        user = User.createOAuthUser(new Email(email), new Nickname(userNickname));
        user = userRepository.save(user);
      }

      UserOAuth newOAuth = UserOAuth.create(user.getId(), provider, providerId);
      userOAuthRepository.save(newOAuth);
    }

    if (!user.canLogin()) {
      throw new IllegalStateException("로그인할 수 없는 계정입니다");
    }

    return generateAndSaveTokens(user, deviceId);
  }

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

  public void logout(Long userId, String deviceId) {
    tokenRepository.deleteRefreshToken(userId, deviceId);
  }

  public void logoutAllDevices(Long userId) {
    tokenRepository.deleteAllRefreshTokens(userId);
  }

  public TokenInfo validateToken(String accessToken) {
    JwtUtil.Claims claims = jwtUtil.parseAccessToken(accessToken);
    return new TokenInfo(claims.userId(), claims.email(), claims.role());
  }

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
