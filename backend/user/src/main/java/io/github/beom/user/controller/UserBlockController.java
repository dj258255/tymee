package io.github.beom.user.controller;

import io.github.beom.core.security.CurrentUser;
import io.github.beom.core.security.UserPrincipal;
import io.github.beom.core.web.ApiResponse;
import io.github.beom.user.dto.BlockUserRequest;
import io.github.beom.user.dto.BlockedUserResponse;
import io.github.beom.user.service.UserBlockService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 사용자 차단 API 컨트롤러. */
@RestController
@RequestMapping(path = "/users/{userId}/blocks", version = "1.0")
@RequiredArgsConstructor
public class UserBlockController {

  private final UserBlockService userBlockService;

  /** POST /users/{userId}/blocks/{targetUserId} - 사용자 차단 */
  @PostMapping("/{targetUserId}")
  @PreAuthorize("isAuthenticated()")
  public ApiResponse<Void> blockUser(
      @CurrentUser UserPrincipal currentUser,
      @PathVariable Long userId,
      @PathVariable Long targetUserId,
      @RequestBody(required = false) BlockUserRequest request) {
    validateOwner(currentUser, userId);
    String reason = request != null ? request.reason() : null;
    userBlockService.blockUser(userId, targetUserId, reason);
    return ApiResponse.success(null);
  }

  /** DELETE /users/{userId}/blocks/{targetUserId} - 차단 해제 */
  @DeleteMapping("/{targetUserId}")
  @PreAuthorize("isAuthenticated()")
  public ApiResponse<Void> unblockUser(
      @CurrentUser UserPrincipal currentUser,
      @PathVariable Long userId,
      @PathVariable Long targetUserId) {
    validateOwner(currentUser, userId);
    userBlockService.unblockUser(userId, targetUserId);
    return ApiResponse.success(null);
  }

  /** GET /users/{userId}/blocks - 차단 목록 조회 */
  @GetMapping
  @PreAuthorize("isAuthenticated()")
  public ApiResponse<List<BlockedUserResponse>> getBlockedUsers(
      @CurrentUser UserPrincipal currentUser, @PathVariable Long userId) {
    validateOwner(currentUser, userId);
    List<BlockedUserResponse> blockedUsers = userBlockService.getBlockedUsers(userId);
    return ApiResponse.success(blockedUsers);
  }

  private void validateOwner(UserPrincipal currentUser, Long targetUserId) {
    if (!currentUser.userId().equals(targetUserId)) {
      throw new AccessDeniedException("본인의 정보만 접근할 수 있습니다");
    }
  }
}
