package io.github.beom.auth.controller;

import io.github.beom.auth.domain.TokenPair;
import io.github.beom.auth.dto.TokenResponse;
import io.github.beom.auth.service.AuthService;
import io.github.beom.core.web.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 개발/테스트 환경 전용 인증 컨트롤러.
 *
 * <p>local, test 프로필에서만 활성화되며, OAuth 검증 없이 테스트 토큰을 발급한다.
 *
 * <p>⚠️ 프로덕션 환경에서는 절대 활성화되지 않음.
 */
@Tag(name = "Dev Auth", description = "개발/테스트 전용 인증 API (local, test 환경에서만 사용 가능)")
@RestController
@RequestMapping(path = "/dev/auth", version = "1.0")
@RequiredArgsConstructor
@Profile({"local", "test"})
public class DevAuthController {

  private final AuthService authService;

  /**
   * POST /dev/auth/login - 개발용 테스트 로그인.
   *
   * <p>OAuth 검증 없이 바로 JWT를 발급한다. 이메일로 기존 사용자를 찾거나 신규 생성한다.
   */
  @Operation(
      summary = "개발용 테스트 로그인",
      description =
          """
          **⚠️ local, test 환경에서만 동작합니다.**

          OAuth 검증 없이 바로 JWT를 발급받습니다.
          - 이메일로 기존 사용자를 찾거나, 없으면 신규 생성합니다.
          - Swagger UI에서 API 테스트할 때 사용하세요.

          ### 사용 방법
          1. 이 API로 토큰 발급
          2. 응답의 `accessToken` 복사
          3. Swagger UI 우측 상단 "Authorize" 클릭
          4. 토큰 붙여넣기 (Bearer 접두사 없이)
          """)
  @PostMapping("/login")
  public ApiResponse<TokenResponse> devLogin(
      @RequestParam(defaultValue = "test@tymee.io") String email,
      @RequestParam(defaultValue = "test-device-001") String deviceId) {
    TokenPair tokenPair = authService.devLogin(email, deviceId);
    return ApiResponse.success(TokenResponse.from(tokenPair));
  }
}
