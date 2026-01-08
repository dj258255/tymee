package io.github.beom.auth.controller;

import io.github.beom.auth.domain.TokenPair;
import io.github.beom.auth.dto.OAuthLoginRequest;
import io.github.beom.auth.dto.RefreshRequest;
import io.github.beom.auth.dto.TokenResponse;
import io.github.beom.auth.service.AuthService;
import io.github.beom.core.security.CurrentUser;
import io.github.beom.core.security.UserPrincipal;
import io.github.beom.core.web.ApiResponse;
import io.github.beom.user.domain.vo.OAuthProvider;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 인증 API 컨트롤러.
 *
 * <p>소셜 로그인, 토큰 갱신, 로그아웃 등 인증 관련 엔드포인트를 제공한다.
 */
@Tag(name = "Auth", description = "인증 API")
@RestController
@RequestMapping(path = "/auth", version = "1.0")
@RequiredArgsConstructor
public class AuthController {

  private final AuthService authService;

  /**
   * POST /auth/login/{provider} - 소셜 로그인.
   *
   * <p>provider: google, apple, kakao 중 하나. idToken/accessToken을 검증하고 자체 JWT 발급.
   */
  @Operation(
      summary = "소셜 로그인",
      description =
          """
          ## 로컬 테스트 방법

          ### 1. Google 로그인 테스트
          1. [Google OAuth Playground](https://developers.google.com/oauthplayground/) 접속
          2. 좌측에서 "Google OAuth2 API v2" > "userinfo.email", "userinfo.profile" 선택
          3. "Authorize APIs" 클릭 → Google 계정으로 로그인
          4. "Exchange authorization code for tokens" 클릭
          5. 응답의 `id_token` 값을 복사
          6. 아래 요청 body의 `token` 필드에 붙여넣기

          ### 2. Apple 로그인 테스트
          - Apple은 실제 iOS 기기/시뮬레이터에서만 테스트 가능
          - Xcode에서 Sign in with Apple 실행 후 받은 identityToken 사용

          ### 3. Kakao 로그인 테스트
          1. [Kakao Developers](https://developers.kakao.com/) 접속
          2. 내 애플리케이션 > 앱 선택 > 도구 > REST API 테스트
          3. 카카오 로그인 후 발급받은 access_token 사용

          ### deviceId 값
          - 로컬 테스트 시 아무 문자열이나 사용 가능 (예: "test-device-001")
          - 실제 앱에서는 기기 고유 ID 사용
          """)
  @PostMapping("/login/{provider}")
  public ApiResponse<TokenResponse> oAuthLogin(
      @Parameter(description = "OAuth 제공자", example = "google") @PathVariable String provider,
      @Valid @RequestBody OAuthLoginRequest request) {
    OAuthProvider oAuthProvider = OAuthProvider.fromCode(provider);
    TokenPair tokenPair =
        authService.oAuthLogin(oAuthProvider, request.token(), request.deviceId());

    return ApiResponse.success(TokenResponse.from(tokenPair));
  }

  /** POST /auth/refresh - Access Token 갱신. Refresh Token으로 새 토큰 쌍 발급. */
  @Operation(summary = "토큰 갱신", description = "Refresh Token으로 새로운 Access/Refresh Token 쌍을 발급받습니다.")
  @PostMapping("/refresh")
  public ApiResponse<TokenResponse> refresh(@Valid @RequestBody RefreshRequest request) {
    TokenPair tokenPair = authService.refresh(request.refreshToken(), request.deviceId());

    return ApiResponse.success(TokenResponse.from(tokenPair));
  }

  /** POST /auth/logout - 로그아웃. 해당 기기의 Refresh Token 삭제. */
  @Operation(summary = "로그아웃", description = "해당 기기의 Refresh Token을 삭제합니다. 인증 필요.")
  @PostMapping("/logout")
  @PreAuthorize("isAuthenticated()")
  public ApiResponse<Void> logout(
      @Parameter(hidden = true) @CurrentUser UserPrincipal user,
      @Parameter(description = "로그아웃할 기기 ID", example = "test-device-001") @RequestParam
          String deviceId) {
    authService.logout(user.userId(), deviceId);
    return ApiResponse.success(null);
  }
}
