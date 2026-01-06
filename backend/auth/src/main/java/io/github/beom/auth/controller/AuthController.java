package io.github.beom.auth.controller;

import io.github.beom.auth.domain.TokenPair;
import io.github.beom.auth.dto.OAuthLoginRequest;
import io.github.beom.auth.dto.RefreshRequest;
import io.github.beom.auth.dto.TokenResponse;
import io.github.beom.auth.service.AuthService;
import io.github.beom.core.web.ApiResponse;
import io.github.beom.user.domain.vo.OAuthProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 인증 API 컨트롤러.
 *
 * <p>소셜 로그인, 토큰 갱신, 로그아웃 등 인증 관련 엔드포인트를 제공한다.
 */
@RestController
@RequestMapping(path = "/auth", version = "1")
@RequiredArgsConstructor
public class AuthController {

  private final AuthService authService;

  /**
   * POST /auth/login/{provider} - 소셜 로그인.
   *
   * <p>provider: google, apple, kakao 중 하나. idToken/accessToken을 검증하고 자체 JWT 발급.
   */
  @PostMapping("/login/{provider}")
  public ApiResponse<TokenResponse> oAuthLogin(
      @PathVariable String provider, @Valid @RequestBody OAuthLoginRequest request) {
    OAuthProvider oAuthProvider = OAuthProvider.fromCode(provider);
    TokenPair tokenPair =
        authService.oAuthLogin(oAuthProvider, request.token(), request.deviceId());

    return ApiResponse.success(TokenResponse.from(tokenPair));
  }

  /** POST /auth/refresh - Access Token 갱신. Refresh Token으로 새 토큰 쌍 발급. */
  @PostMapping("/refresh")
  public ApiResponse<TokenResponse> refresh(@Valid @RequestBody RefreshRequest request) {
    TokenPair tokenPair = authService.refresh(request.refreshToken(), request.deviceId());

    return ApiResponse.success(TokenResponse.from(tokenPair));
  }

  /** POST /auth/logout - 로그아웃. 해당 기기의 Refresh Token 삭제. */
  @PostMapping("/logout")
  public ApiResponse<Void> logout(
      @RequestHeader("X-User-Id") Long userId, @RequestParam String deviceId) {
    authService.logout(userId, deviceId);
    return ApiResponse.success(null);
  }
}
