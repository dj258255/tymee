package io.github.beom.user.controller;

import io.github.beom.core.security.CurrentUser;
import io.github.beom.core.security.UserPrincipal;
import io.github.beom.core.web.ApiResponse;
import io.github.beom.user.domain.UserNotificationSettings;
import io.github.beom.user.dto.UserNotificationSettingsResponse;
import io.github.beom.user.dto.UserNotificationSettingsUpdateRequest;
import io.github.beom.user.service.UserNotificationSettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 사용자 알림 설정 API 컨트롤러. */
@Tag(name = "UserNotificationSettings", description = "사용자 알림 설정 API")
@RestController
@RequestMapping(path = "/users/{userId}/notification-settings", version = "1.0")
@RequiredArgsConstructor
public class UserNotificationSettingsController {

  private final UserNotificationSettingsService service;

  /** GET /users/{userId}/notification-settings - 사용자 알림 설정 조회. */
  @Operation(summary = "사용자 알림 설정 조회", description = "사용자의 푸시 알림 설정을 조회합니다. 본인만 조회 가능합니다.")
  @GetMapping
  @PreAuthorize("isAuthenticated()")
  public ApiResponse<UserNotificationSettingsResponse> getSettings(
      @Parameter(description = "사용자 ID") @PathVariable Long userId,
      @Parameter(hidden = true) @CurrentUser UserPrincipal currentUser) {
    validateOwner(userId, currentUser);

    UserNotificationSettings settings = service.getSettings(userId);
    return ApiResponse.success(UserNotificationSettingsResponse.from(settings));
  }

  /** PATCH /users/{userId}/notification-settings - 사용자 알림 설정 수정. */
  @Operation(
      summary = "사용자 알림 설정 수정",
      description =
          """
          사용자의 푸시 알림 설정을 수정합니다. 본인만 수정 가능합니다.

          변경할 필드만 전송하면 해당 필드만 업데이트됩니다 (부분 업데이트).

          ### 유효성 검증
          - pushTimeBlockMinutesBefore: 0~60
          """)
  @PatchMapping
  @PreAuthorize("isAuthenticated()")
  public ApiResponse<UserNotificationSettingsResponse> updateSettings(
      @Parameter(description = "사용자 ID") @PathVariable Long userId,
      @Parameter(hidden = true) @CurrentUser UserPrincipal currentUser,
      @Valid @RequestBody UserNotificationSettingsUpdateRequest request) {
    validateOwner(userId, currentUser);

    UserNotificationSettings settings = service.updateSettings(userId, request);
    return ApiResponse.success(UserNotificationSettingsResponse.from(settings));
  }

  private void validateOwner(Long userId, UserPrincipal currentUser) {
    if (!userId.equals(currentUser.userId())) {
      throw new AccessDeniedException("본인의 설정만 조회/수정할 수 있습니다");
    }
  }
}
