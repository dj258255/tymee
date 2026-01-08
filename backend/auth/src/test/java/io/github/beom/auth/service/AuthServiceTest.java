package io.github.beom.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

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
import io.github.beom.user.domain.vo.UserStatus;
import io.github.beom.user.repository.UserOAuthRepository;
import io.github.beom.user.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

  @Mock private UserRepository userRepository;
  @Mock private UserOAuthRepository userOAuthRepository;
  @Mock private JwtUtil jwtUtil;
  @Mock private RedisTokenRepository tokenRepository;
  @Mock private OAuthVerifierFactory oAuthVerifierFactory;
  @Mock private OAuthVerifier oAuthVerifier;

  @InjectMocks private AuthService authService;

  private static final String DEVICE_ID = "test-device-id";
  private static final String ACCESS_TOKEN = "access-token";
  private static final String REFRESH_TOKEN = "refresh-token";
  private static final long ACCESS_EXPIRES_IN = 3600L;
  private static final long REFRESH_EXPIRES_IN = 604800L;

  @Nested
  @DisplayName("OAuth 로그인")
  class OAuthLogin {

    @Test
    @DisplayName("성공: 신규 사용자 - 회원가입 후 토큰 발급")
    void newUser_success() {
      // given
      var userInfo =
          new OAuthUserInfo(OAuthProvider.GOOGLE, "google-123", "test@gmail.com", "Test", null);
      var expectedTokenPair =
          TokenPair.of(ACCESS_TOKEN, REFRESH_TOKEN, ACCESS_EXPIRES_IN, REFRESH_EXPIRES_IN);

      given(oAuthVerifierFactory.getVerifier(OAuthProvider.GOOGLE)).willReturn(oAuthVerifier);
      given(oAuthVerifier.verify("google-id-token")).willReturn(userInfo);
      given(userOAuthRepository.findByProviderAndProviderId(OAuthProvider.GOOGLE, "google-123"))
          .willReturn(Optional.empty());
      given(userRepository.findByEmail("test@gmail.com")).willReturn(Optional.empty());
      given(userRepository.save(any(User.class)))
          .willAnswer(
              invocation -> {
                User user = invocation.getArgument(0);
                return User.builder()
                    .id(1L)
                    .email(user.getEmail())
                    .nickname(user.getNickname())
                    .build();
              });
      given(jwtUtil.generateTokenPair(eq(1L), any(), any())).willReturn(expectedTokenPair);
      given(jwtUtil.getRefreshTokenExpirationSeconds()).willReturn(604800L);

      // when
      var result = authService.oAuthLogin(OAuthProvider.GOOGLE, "google-id-token", DEVICE_ID);

      // then
      assertThat(result.getAccessToken()).isEqualTo(ACCESS_TOKEN);
      assertThat(result.getRefreshToken()).isEqualTo(REFRESH_TOKEN);
      verify(userRepository).save(any(User.class));
      verify(userOAuthRepository).save(any(UserOAuth.class));
      verify(tokenRepository).saveRefreshToken(any(RefreshToken.class));
    }

    @Test
    @DisplayName("성공: 기존 사용자 - 토큰만 발급")
    void existingUser_success() {
      // given
      var existingUser =
          User.builder()
              .id(1L)
              .email(new Email("test@gmail.com"))
              .nickname(new Nickname("testuser"))
              .build();
      var existingOAuth = UserOAuth.create(1L, OAuthProvider.GOOGLE, "google-123");
      var userInfo =
          new OAuthUserInfo(OAuthProvider.GOOGLE, "google-123", "test@gmail.com", "Test", null);
      var expectedTokenPair =
          TokenPair.of(ACCESS_TOKEN, REFRESH_TOKEN, ACCESS_EXPIRES_IN, REFRESH_EXPIRES_IN);

      given(oAuthVerifierFactory.getVerifier(OAuthProvider.GOOGLE)).willReturn(oAuthVerifier);
      given(oAuthVerifier.verify("google-id-token")).willReturn(userInfo);
      given(userOAuthRepository.findByProviderAndProviderId(OAuthProvider.GOOGLE, "google-123"))
          .willReturn(Optional.of(existingOAuth));
      given(userRepository.findById(1L)).willReturn(Optional.of(existingUser));
      given(jwtUtil.generateTokenPair(eq(1L), any(), any())).willReturn(expectedTokenPair);
      given(jwtUtil.getRefreshTokenExpirationSeconds()).willReturn(604800L);

      // when
      var result = authService.oAuthLogin(OAuthProvider.GOOGLE, "google-id-token", DEVICE_ID);

      // then
      assertThat(result.getAccessToken()).isEqualTo(ACCESS_TOKEN);
      verify(userRepository, never()).save(any(User.class));
      verify(userOAuthRepository, never()).save(any(UserOAuth.class));
    }

    @Test
    @DisplayName("성공: 탈퇴한 사용자 재로그인 - 계정 복구")
    void withdrawnUser_reactivated() {
      // given
      var withdrawnUser =
          User.builder()
              .id(1L)
              .email(new Email("test@gmail.com"))
              .nickname(new Nickname("testuser"))
              .status(UserStatus.WITHDRAWN)
              .deletedAt(LocalDateTime.now().minusDays(1))
              .build();
      var existingOAuth = UserOAuth.create(1L, OAuthProvider.GOOGLE, "google-123");
      var userInfo =
          new OAuthUserInfo(OAuthProvider.GOOGLE, "google-123", "test@gmail.com", "Test", null);
      var expectedTokenPair =
          TokenPair.of(ACCESS_TOKEN, REFRESH_TOKEN, ACCESS_EXPIRES_IN, REFRESH_EXPIRES_IN);

      given(oAuthVerifierFactory.getVerifier(OAuthProvider.GOOGLE)).willReturn(oAuthVerifier);
      given(oAuthVerifier.verify("google-id-token")).willReturn(userInfo);
      given(userOAuthRepository.findByProviderAndProviderId(OAuthProvider.GOOGLE, "google-123"))
          .willReturn(Optional.of(existingOAuth));
      given(userRepository.findById(1L)).willReturn(Optional.of(withdrawnUser));
      given(userRepository.save(any(User.class)))
          .willAnswer(invocation -> invocation.getArgument(0));
      given(jwtUtil.generateTokenPair(eq(1L), any(), any())).willReturn(expectedTokenPair);
      given(jwtUtil.getRefreshTokenExpirationSeconds()).willReturn(604800L);

      // when
      var result = authService.oAuthLogin(OAuthProvider.GOOGLE, "google-id-token", DEVICE_ID);

      // then
      assertThat(result.getAccessToken()).isEqualTo(ACCESS_TOKEN);
      verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("실패: 정지된 사용자")
    void bannedUser_throwsException() {
      // given
      var bannedUser =
          User.builder()
              .id(1L)
              .email(new Email("test@gmail.com"))
              .nickname(new Nickname("testuser"))
              .status(UserStatus.BANNED)
              .build();
      var existingOAuth = UserOAuth.create(1L, OAuthProvider.GOOGLE, "google-123");
      var userInfo =
          new OAuthUserInfo(OAuthProvider.GOOGLE, "google-123", "test@gmail.com", "Test", null);

      given(oAuthVerifierFactory.getVerifier(OAuthProvider.GOOGLE)).willReturn(oAuthVerifier);
      given(oAuthVerifier.verify("google-id-token")).willReturn(userInfo);
      given(userOAuthRepository.findByProviderAndProviderId(OAuthProvider.GOOGLE, "google-123"))
          .willReturn(Optional.of(existingOAuth));
      given(userRepository.findById(1L)).willReturn(Optional.of(bannedUser));

      // when & then
      assertThatThrownBy(
              () -> authService.oAuthLogin(OAuthProvider.GOOGLE, "google-id-token", DEVICE_ID))
          .isInstanceOf(IllegalStateException.class)
          .hasMessage("로그인할 수 없는 계정입니다");
    }

    @Test
    @DisplayName("실패: 연동 해제된 OAuth")
    void unlinkedOAuth_throwsException() {
      // given
      var unlinkedOAuth = UserOAuth.create(1L, OAuthProvider.GOOGLE, "google-123");
      unlinkedOAuth.unlink();
      var userInfo =
          new OAuthUserInfo(OAuthProvider.GOOGLE, "google-123", "test@gmail.com", "Test", null);

      given(oAuthVerifierFactory.getVerifier(OAuthProvider.GOOGLE)).willReturn(oAuthVerifier);
      given(oAuthVerifier.verify("google-id-token")).willReturn(userInfo);
      given(userOAuthRepository.findByProviderAndProviderId(OAuthProvider.GOOGLE, "google-123"))
          .willReturn(Optional.of(unlinkedOAuth));

      // when & then
      assertThatThrownBy(
              () -> authService.oAuthLogin(OAuthProvider.GOOGLE, "google-id-token", DEVICE_ID))
          .isInstanceOf(IllegalStateException.class)
          .hasMessage("연동 해제된 계정입니다. 다시 연동해주세요");
    }

    @Test
    @DisplayName("성공: 이메일 없는 애플 로그인")
    void appleLoginWithoutEmail_success() {
      // given
      var userInfo = new OAuthUserInfo(OAuthProvider.APPLE, "apple-123", null, null, null);
      var expectedTokenPair =
          TokenPair.of(ACCESS_TOKEN, REFRESH_TOKEN, ACCESS_EXPIRES_IN, REFRESH_EXPIRES_IN);

      given(oAuthVerifierFactory.getVerifier(OAuthProvider.APPLE)).willReturn(oAuthVerifier);
      given(oAuthVerifier.verify("apple-id-token")).willReturn(userInfo);
      given(userOAuthRepository.findByProviderAndProviderId(OAuthProvider.APPLE, "apple-123"))
          .willReturn(Optional.empty());
      given(userRepository.save(any(User.class)))
          .willAnswer(
              invocation -> {
                User user = invocation.getArgument(0);
                return User.builder()
                    .id(1L)
                    .email(user.getEmail())
                    .nickname(user.getNickname())
                    .build();
              });
      given(jwtUtil.generateTokenPair(eq(1L), any(), any())).willReturn(expectedTokenPair);
      given(jwtUtil.getRefreshTokenExpirationSeconds()).willReturn(604800L);

      // when
      var result = authService.oAuthLogin(OAuthProvider.APPLE, "apple-id-token", DEVICE_ID);

      // then
      assertThat(result).isNotNull();
      verify(userRepository).save(any(User.class));
    }
  }

  @Nested
  @DisplayName("토큰 갱신")
  class Refresh {

    @Test
    @DisplayName("성공: 유효한 리프레시 토큰")
    void validRefreshToken_success() {
      // given
      var user =
          User.builder()
              .id(1L)
              .email(new Email("test@gmail.com"))
              .nickname(new Nickname("testuser"))
              .build();
      var storedToken =
          RefreshToken.create(REFRESH_TOKEN, 1L, DEVICE_ID, LocalDateTime.now().plusDays(7));
      var expectedTokenPair =
          TokenPair.of("new-access", "new-refresh", ACCESS_EXPIRES_IN, REFRESH_EXPIRES_IN);

      given(jwtUtil.parseRefreshToken(REFRESH_TOKEN))
          .willReturn(
              new JwtUtil.Claims(
                  1L, "test@gmail.com", "USER", System.currentTimeMillis() + 3600000));
      given(tokenRepository.findRefreshToken(1L, DEVICE_ID)).willReturn(Optional.of(storedToken));
      given(userRepository.findById(1L)).willReturn(Optional.of(user));
      given(jwtUtil.generateTokenPair(eq(1L), any(), any())).willReturn(expectedTokenPair);
      given(jwtUtil.getRefreshTokenExpirationSeconds()).willReturn(604800L);

      // when
      var result = authService.refresh(REFRESH_TOKEN, DEVICE_ID);

      // then
      assertThat(result.getAccessToken()).isEqualTo("new-access");
      assertThat(result.getRefreshToken()).isEqualTo("new-refresh");
    }

    @Test
    @DisplayName("실패: 토큰 불일치 - 탈취 감지, 전체 로그아웃")
    void tokenMismatch_detectsTheft() {
      // given
      var storedToken =
          RefreshToken.create("different-token", 1L, DEVICE_ID, LocalDateTime.now().plusDays(7));

      given(jwtUtil.parseRefreshToken(REFRESH_TOKEN))
          .willReturn(
              new JwtUtil.Claims(
                  1L, "test@gmail.com", "USER", System.currentTimeMillis() + 3600000));
      given(tokenRepository.findRefreshToken(1L, DEVICE_ID)).willReturn(Optional.of(storedToken));

      // when & then
      assertThatThrownBy(() -> authService.refresh(REFRESH_TOKEN, DEVICE_ID))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("토큰이 탈취되었을 수 있습니다");

      verify(tokenRepository).deleteAllRefreshTokens(1L);
    }

    @Test
    @DisplayName("실패: 만료된 리프레시 토큰")
    void expiredToken_requiresReLogin() {
      // given
      var expiredToken =
          RefreshToken.create(REFRESH_TOKEN, 1L, DEVICE_ID, LocalDateTime.now().minusDays(1));

      given(jwtUtil.parseRefreshToken(REFRESH_TOKEN))
          .willReturn(
              new JwtUtil.Claims(
                  1L, "test@gmail.com", "USER", System.currentTimeMillis() + 3600000));
      given(tokenRepository.findRefreshToken(1L, DEVICE_ID)).willReturn(Optional.of(expiredToken));

      // when & then
      assertThatThrownBy(() -> authService.refresh(REFRESH_TOKEN, DEVICE_ID))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("리프레시 토큰이 만료되었습니다. 다시 로그인해주세요");

      verify(tokenRepository).deleteRefreshToken(1L, DEVICE_ID);
    }

    @Test
    @DisplayName("실패: 존재하지 않는 토큰")
    void nonExistentToken_fails() {
      // given
      given(jwtUtil.parseRefreshToken(REFRESH_TOKEN))
          .willReturn(
              new JwtUtil.Claims(
                  1L, "test@gmail.com", "USER", System.currentTimeMillis() + 3600000));
      given(tokenRepository.findRefreshToken(1L, DEVICE_ID)).willReturn(Optional.empty());

      // when & then
      assertThatThrownBy(() -> authService.refresh(REFRESH_TOKEN, DEVICE_ID))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("유효하지 않은 리프레시 토큰입니다");
    }

    @Test
    @DisplayName("실패: 정지된 사용자 - 전체 로그아웃")
    void bannedUser_logsOutAll() {
      // given
      var bannedUser =
          User.builder()
              .id(1L)
              .email(new Email("test@gmail.com"))
              .nickname(new Nickname("testuser"))
              .status(UserStatus.BANNED)
              .build();
      var storedToken =
          RefreshToken.create(REFRESH_TOKEN, 1L, DEVICE_ID, LocalDateTime.now().plusDays(7));

      given(jwtUtil.parseRefreshToken(REFRESH_TOKEN))
          .willReturn(
              new JwtUtil.Claims(
                  1L, "test@gmail.com", "USER", System.currentTimeMillis() + 3600000));
      given(tokenRepository.findRefreshToken(1L, DEVICE_ID)).willReturn(Optional.of(storedToken));
      given(userRepository.findById(1L)).willReturn(Optional.of(bannedUser));

      // when & then
      assertThatThrownBy(() -> authService.refresh(REFRESH_TOKEN, DEVICE_ID))
          .isInstanceOf(IllegalStateException.class)
          .hasMessage("로그인할 수 없는 계정입니다");

      verify(tokenRepository).deleteAllRefreshTokens(1L);
    }
  }

  @Nested
  @DisplayName("로그아웃")
  class Logout {

    @Test
    @DisplayName("성공: 단일 기기 로그아웃")
    void singleDevice_success() {
      // when
      authService.logout(1L, DEVICE_ID);

      // then
      verify(tokenRepository).deleteRefreshToken(1L, DEVICE_ID);
    }

    @Test
    @DisplayName("성공: 전체 기기 로그아웃")
    void allDevices_success() {
      // when
      authService.logoutAllDevices(1L);

      // then
      verify(tokenRepository).deleteAllRefreshTokens(1L);
    }
  }
}
