package io.github.beom.auth.dto;

import jakarta.validation.constraints.NotBlank;

/** 토큰 갱신 요청 DTO. */
public record RefreshRequest(
    @NotBlank(message = "리프레시 토큰은 필수입니다") String refreshToken,
    @NotBlank(message = "디바이스 ID는 필수입니다") String deviceId) {}
