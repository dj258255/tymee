package io.github.beom.user.controller;

import io.github.beom.user.domain.User;
import io.github.beom.user.dto.UpdateProfileRequest;
import io.github.beom.user.dto.UserProfileResponse;
import io.github.beom.user.dto.UserResponse;
import io.github.beom.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** 사용자 API 컨트롤러. */
@RestController
@RequestMapping(path = "/users", version = "1")
@RequiredArgsConstructor
public class UserController {

  private final UserService userService;

  /** GET /users/{id} - 내 정보 조회 (전체 필드) */
  @GetMapping("/{id}")
  public ResponseEntity<UserResponse> getUser(@PathVariable Long id) {
    User user = userService.getById(id);
    return ResponseEntity.ok(UserResponse.from(user));
  }

  /** GET /users/{id}/profile - 타인 프로필 조회 (공개 필드만) */
  @GetMapping("/{id}/profile")
  public ResponseEntity<UserProfileResponse> getUserProfile(@PathVariable Long id) {
    User user = userService.getById(id);
    return ResponseEntity.ok(UserProfileResponse.from(user));
  }

  /** PATCH /users/{id} - 프로필 수정 */
  @PatchMapping("/{id}")
  public ResponseEntity<UserResponse> updateProfile(
      @PathVariable Long id, @Valid @RequestBody UpdateProfileRequest request) {
    User user = userService.updateProfile(id, request.nickname(), request.bio());
    return ResponseEntity.ok(UserResponse.from(user));
  }

  /** PATCH /users/{id}/profile-image - 프로필 이미지 변경 */
  @PatchMapping("/{id}/profile-image")
  public ResponseEntity<UserResponse> updateProfileImage(
      @PathVariable Long id, @RequestParam Long profileImageId) {
    User user = userService.updateProfileImage(id, profileImageId);
    return ResponseEntity.ok(UserResponse.from(user));
  }

  /** DELETE /users/{id} - 회원 탈퇴 (소프트 삭제) */
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> withdrawUser(@PathVariable Long id) {
    userService.withdrawUser(id);
    return ResponseEntity.noContent().build();
  }

  /** GET /users/check-nickname - 닉네임 중복 확인 */
  @GetMapping("/check-nickname")
  public ResponseEntity<Boolean> checkNicknameExists(@RequestParam String nickname) {
    return ResponseEntity.ok(userService.existsByNickname(nickname));
  }
}
