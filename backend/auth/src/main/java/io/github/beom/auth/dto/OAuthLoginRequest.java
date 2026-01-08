package io.github.beom.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

/** 소셜 로그인 요청 DTO. idToken 또는 accessToken과 deviceId만 전송. */
@Schema(description = "소셜 로그인 요청")
public record OAuthLoginRequest(
    @Schema(
            description = "OAuth 토큰 (Google/Apple: id_token, Kakao: access_token)",
            example = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...")
        @NotBlank(message = "토큰은 필수입니다")
        String token,
    @Schema(description = "기기 고유 ID (로컬 테스트 시 아무 값이나 사용)", example = "test-device-001")
        @NotBlank(message = "디바이스 ID는 필수입니다")
        String deviceId) {}
