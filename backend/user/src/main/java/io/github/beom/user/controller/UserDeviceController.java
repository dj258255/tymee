package io.github.beom.user.controller;

import io.github.beom.core.web.ApiResponse;
import io.github.beom.user.dto.RegisterDeviceRequest;
import io.github.beom.user.service.UserDeviceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 사용자 디바이스 API 컨트롤러.
 *
 * <p>FCM 푸시 알림을 위한 디바이스 토큰 등록/삭제를 처리한다.
 */
@RestController
@RequestMapping(path = "/users/{userId}/devices", version = "1")
@RequiredArgsConstructor
public class UserDeviceController {

  private final UserDeviceService userDeviceService;

  /** POST /users/{userId}/devices - 디바이스 등록 */
  @PostMapping
  public ApiResponse<Void> registerDevice(
      @PathVariable Long userId, @Valid @RequestBody RegisterDeviceRequest request) {
    userDeviceService.registerDevice(
        userId,
        request.deviceId(),
        request.deviceType(),
        request.pushToken(),
        request.appVersion(),
        request.osVersion());
    return ApiResponse.success(null);
  }

  /** DELETE /users/{userId}/devices - FCM 토큰 삭제 (로그아웃 시) */
  @DeleteMapping
  public ApiResponse<Void> unregisterDevice(
      @PathVariable Long userId, @RequestParam String deviceId) {
    userDeviceService.unregisterDevice(userId, deviceId);
    return ApiResponse.success(null);
  }
}
