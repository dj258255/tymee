package io.github.beom.user.dto;

import io.github.beom.user.domain.vo.DevicePlatform;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * 디바이스 등록 요청 DTO.
 *
 * @param deviceId 디바이스 고유 ID
 * @param deviceType 플랫폼 (IOS, ANDROID)
 * @param pushToken FCM/APNs 토큰
 * @param appVersion 앱 버전
 * @param osVersion OS 버전
 */
public record RegisterDeviceRequest(
    @NotBlank(message = "디바이스 ID는 필수입니다") String deviceId,
    @NotNull(message = "디바이스 타입은 필수입니다") DevicePlatform deviceType,
    String pushToken,
    String appVersion,
    String osVersion) {}
