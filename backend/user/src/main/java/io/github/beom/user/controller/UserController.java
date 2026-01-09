package io.github.beom.user.controller;

import io.github.beom.core.security.CurrentUser;
import io.github.beom.core.security.UserPrincipal;
import io.github.beom.core.web.ApiResponse;
import io.github.beom.user.domain.User;
import io.github.beom.user.dto.UpdateProfileRequest;
import io.github.beom.user.dto.UserProfileResponse;
import io.github.beom.user.dto.UserResponse;
import io.github.beom.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** 사용자 API 컨트롤러. */
@Tag(name = "User", description = "사용자 API")
@RestController
@RequestMapping(path = "/users", version = "1.0")
@RequiredArgsConstructor
public class UserController {

  private final UserService userService;

  /** GET /users/{id} - 내 정보 조회 (전체 필드). 본인만 조회 가능. */
  @Operation(summary = "내 정보 조회", description = "본인의 전체 정보를 조회합니다. 인증 필요, 본인만 조회 가능.")
  @GetMapping("/{id}")
  @PreAuthorize("isAuthenticated()")
  public ApiResponse<UserResponse> getUser(
      @Parameter(hidden = true) @CurrentUser UserPrincipal currentUser,
      @Parameter(description = "사용자 ID", example = "1") @PathVariable Long id) {
    validateOwner(currentUser, id);
    User user = userService.getById(id);
    return ApiResponse.success(UserResponse.from(user));
  }

  /** GET /users/{id}/profile - 타인 프로필 조회 (공개 필드만) */
  @Operation(summary = "프로필 조회", description = "다른 사용자의 공개 프로필을 조회합니다. 인증 불필요.")
  @GetMapping("/{id}/profile")
  public ApiResponse<UserProfileResponse> getUserProfile(
      @Parameter(description = "사용자 ID", example = "1") @PathVariable Long id) {
    User user = userService.getById(id);
    return ApiResponse.success(UserProfileResponse.from(user));
  }

  /** PATCH /users/{id} - 프로필 수정. 본인만 수정 가능. */
  @Operation(summary = "프로필 수정", description = "본인의 프로필(닉네임, 소개글)을 수정합니다. 인증 필요, 본인만 수정 가능.")
  @PatchMapping("/{id}")
  @PreAuthorize("isAuthenticated()")
  public ApiResponse<UserResponse> updateProfile(
      @Parameter(hidden = true) @CurrentUser UserPrincipal currentUser,
      @Parameter(description = "사용자 ID", example = "1") @PathVariable Long id,
      @Valid @RequestBody UpdateProfileRequest request) {
    validateOwner(currentUser, id);
    User updated = userService.updateProfile(id, request.nickname(), request.bio());
    return ApiResponse.success(UserResponse.from(updated));
  }

  /** DELETE /users/{id} - 회원 탈퇴 (소프트 삭제). 본인만 탈퇴 가능. */
  @Operation(summary = "회원 탈퇴", description = "본인의 계정을 탈퇴합니다 (소프트 삭제). 인증 필요, 본인만 탈퇴 가능.")
  @DeleteMapping("/{id}")
  @PreAuthorize("isAuthenticated()")
  public ApiResponse<Void> withdrawUser(
      @Parameter(hidden = true) @CurrentUser UserPrincipal currentUser,
      @Parameter(description = "사용자 ID", example = "1") @PathVariable Long id) {
    validateOwner(currentUser, id);
    userService.withdrawUser(id);
    return ApiResponse.success();
  }

  /** GET /users/check-nickname - 닉네임 중복 확인 */
  @Operation(summary = "닉네임 중복 확인", description = "닉네임이 이미 사용 중인지 확인합니다. 인증 불필요.")
  @GetMapping("/check-nickname")
  public ApiResponse<Boolean> checkNicknameExists(
      @Parameter(description = "확인할 닉네임", example = "tymee_user") @RequestParam String nickname) {
    return ApiResponse.success(userService.existsByNickname(nickname));
  }

  private void validateOwner(UserPrincipal currentUser, Long targetUserId) {
    if (!currentUser.userId().equals(targetUserId)) {
      throw new AccessDeniedException("본인의 정보만 접근할 수 있습니다");
    }
  }
}
