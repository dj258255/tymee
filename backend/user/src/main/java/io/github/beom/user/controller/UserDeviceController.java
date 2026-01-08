package io.github.beom.user.controller;

import io.github.beom.core.security.CurrentUser;
import io.github.beom.core.security.UserPrincipal;
import io.github.beom.core.web.ApiResponse;
import io.github.beom.user.dto.RegisterDeviceRequest;
import io.github.beom.user.service.UserDeviceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
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
@RequestMapping(path = "/users/{userId}/devices", version = "1.0")
@RequiredArgsConstructor
public class UserDeviceController {

  private final UserDeviceService userDeviceService;

  /** POST /users/{userId}/devices - 디바이스 등록 */
  @PostMapping
  @PreAuthorize("isAuthenticated()")
  public ApiResponse<Void> registerDevice(
      @CurrentUser UserPrincipal currentUser,
      @PathVariable Long userId,
      @Valid @RequestBody RegisterDeviceRequest request) {
    validateOwner(currentUser, userId);
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
  @PreAuthorize("isAuthenticated()")
  public ApiResponse<Void> unregisterDevice(
      @CurrentUser UserPrincipal currentUser,
      @PathVariable Long userId,
      @RequestParam String deviceId) {
    validateOwner(currentUser, userId);
    userDeviceService.unregisterDevice(userId, deviceId);
    return ApiResponse.success(null);
  }

  private void validateOwner(UserPrincipal currentUser, Long targetUserId) {
    if (!currentUser.userId().equals(targetUserId)) {
      throw new AccessDeniedException("본인의 정보만 접근할 수 있습니다");
    }
  }
}
