package io.github.beom.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record OAuthLoginRequest(
    @NotBlank(message = "제공자 ID는 필수입니다") String providerId,
    @Email(message = "올바른 이메일 형식이 아닙니다") String email,
    String nickname,
    @NotBlank(message = "디바이스 ID는 필수입니다") String deviceId) {}
