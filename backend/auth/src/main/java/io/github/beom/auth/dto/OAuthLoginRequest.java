package io.github.beom.auth.dto;

import jakarta.validation.constraints.NotBlank;

/** 소셜 로그인 요청 DTO. idToken 또는 accessToken과 deviceId만 전송. */
public record OAuthLoginRequest(
    @NotBlank(message = "토큰은 필수입니다") String token,
    @NotBlank(message = "디바이스 ID는 필수입니다") String deviceId) {}
