package io.github.beom.user.dto;

import io.github.beom.user.domain.vo.DevicePlatform;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * 디바이스 등록 요청 DTO.
 *
 * @param fcmToken FCM 토큰
 * @param platform 플랫폼 (IOS, ANDROID)
 * @param deviceId 디바이스 고유 ID
 */
public record RegisterDeviceRequest(
    @NotBlank(message = "FCM 토큰은 필수입니다") String fcmToken,
    @NotNull(message = "플랫폼은 필수입니다") DevicePlatform platform,
    @NotBlank(message = "디바이스 ID는 필수입니다") String deviceId) {}
