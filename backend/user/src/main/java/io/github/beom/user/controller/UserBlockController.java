package io.github.beom.user.controller;

import io.github.beom.core.web.ApiResponse;
import io.github.beom.user.dto.BlockUserRequest;
import io.github.beom.user.dto.BlockedUserResponse;
import io.github.beom.user.service.UserBlockService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 사용자 차단 API 컨트롤러. */
@RestController
@RequestMapping(path = "/users/{userId}/blocks", version = "1")
@RequiredArgsConstructor
public class UserBlockController {

  private final UserBlockService userBlockService;

  /** POST /users/{userId}/blocks/{targetUserId} - 사용자 차단 */
  @PostMapping("/{targetUserId}")
  public ApiResponse<Void> blockUser(
      @PathVariable Long userId,
      @PathVariable Long targetUserId,
      @RequestBody(required = false) BlockUserRequest request) {
    String reason = request != null ? request.reason() : null;
    userBlockService.blockUser(userId, targetUserId, reason);
    return ApiResponse.success(null);
  }

  /** DELETE /users/{userId}/blocks/{targetUserId} - 차단 해제 */
  @DeleteMapping("/{targetUserId}")
  public ApiResponse<Void> unblockUser(@PathVariable Long userId, @PathVariable Long targetUserId) {
    userBlockService.unblockUser(userId, targetUserId);
    return ApiResponse.success(null);
  }

  /** GET /users/{userId}/blocks - 차단 목록 조회 */
  @GetMapping
  public ApiResponse<List<BlockedUserResponse>> getBlockedUsers(@PathVariable Long userId) {
    List<BlockedUserResponse> blockedUsers = userBlockService.getBlockedUsers(userId);
    return ApiResponse.success(blockedUsers);
  }
}
