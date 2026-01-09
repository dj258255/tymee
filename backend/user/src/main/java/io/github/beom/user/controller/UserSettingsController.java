package io.github.beom.user.controller;

import io.github.beom.core.security.CurrentUser;
import io.github.beom.core.security.UserPrincipal;
import io.github.beom.core.web.ApiResponse;
import io.github.beom.user.domain.UserSettings;
import io.github.beom.user.dto.UserSettingsResponse;
import io.github.beom.user.dto.UserSettingsUpdateRequest;
import io.github.beom.user.mapper.UserSettingsMapper;
import io.github.beom.user.service.UserSettingsService;
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

/** 사용자 설정 API 컨트롤러. */
@Tag(name = "UserSettings", description = "사용자 설정 API")
@RestController
@RequestMapping(path = "/users/{userId}/settings", version = "1.0")
@RequiredArgsConstructor
public class UserSettingsController {

  private final UserSettingsService userSettingsService;
  private final UserSettingsMapper userSettingsMapper;

  /** GET /users/{userId}/settings - 사용자 설정 조회. */
  @Operation(summary = "사용자 설정 조회", description = "사용자의 앱 설정을 조회합니다. 본인만 조회 가능합니다.")
  @GetMapping
  @PreAuthorize("isAuthenticated()")
  public ApiResponse<UserSettingsResponse> getSettings(
      @Parameter(description = "사용자 ID") @PathVariable Long userId,
      @Parameter(hidden = true) @CurrentUser UserPrincipal currentUser) {
    validateOwner(userId, currentUser);

    UserSettings settings = userSettingsService.getSettings(userId);
    return ApiResponse.success(userSettingsMapper.toResponse(settings));
  }

  /** PATCH /users/{userId}/settings - 사용자 설정 수정. */
  @Operation(
      summary = "사용자 설정 수정",
      description =
          """
          사용자의 앱 설정을 수정합니다. 본인만 수정 가능합니다.

          변경할 필드만 전송하면 해당 필드만 업데이트됩니다 (부분 업데이트).

          ### 유효성 검증
          - themeMode: LIGHT, DARK, SYSTEM 중 하나
          - language: KO, JA, EN 중 하나
          - plannerStartHour: 0~23
          - dailyGoalMinutes: 0~1440 (최대 24시간)
          - weeklyGoalMinutes: 0~10080 (최대 7일)
          """)
  @PatchMapping
  @PreAuthorize("isAuthenticated()")
  public ApiResponse<UserSettingsResponse> updateSettings(
      @Parameter(description = "사용자 ID") @PathVariable Long userId,
      @Parameter(hidden = true) @CurrentUser UserPrincipal currentUser,
      @Valid @RequestBody UserSettingsUpdateRequest request) {
    validateOwner(userId, currentUser);

    UserSettings settings = userSettingsService.updateSettings(userId, request);
    return ApiResponse.success(userSettingsMapper.toResponse(settings));
  }

  private void validateOwner(Long userId, UserPrincipal currentUser) {
    if (!userId.equals(currentUser.userId())) {
      throw new AccessDeniedException("본인의 설정만 조회/수정할 수 있습니다");
    }
  }
}
