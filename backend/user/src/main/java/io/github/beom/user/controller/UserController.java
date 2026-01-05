package io.github.beom.user.controller;

import io.github.beom.user.domain.User;
import io.github.beom.user.dto.CreateUserRequest;
import io.github.beom.user.dto.UpdateProfileRequest;
import io.github.beom.user.dto.UserProfileResponse;
import io.github.beom.user.dto.UserResponse;
import io.github.beom.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/users", version = "1")
@RequiredArgsConstructor
public class UserController {

  private final UserService userService;

  @GetMapping("/{id}")
  public ResponseEntity<UserResponse> getUser(@PathVariable Long id) {
    User user = userService.getById(id);
    return ResponseEntity.ok(UserResponse.from(user));
  }

  @GetMapping("/{id}/profile")
  public ResponseEntity<UserProfileResponse> getUserProfile(@PathVariable Long id) {
    User user = userService.getById(id);
    return ResponseEntity.ok(UserProfileResponse.from(user));
  }

  @PostMapping
  public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
    User user = userService.createUser(request.email(), request.password(), request.nickname());
    return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.from(user));
  }

  @PatchMapping("/{id}")
  public ResponseEntity<UserResponse> updateProfile(
      @PathVariable Long id, @Valid @RequestBody UpdateProfileRequest request) {
    User user = userService.updateProfile(id, request.nickname(), request.bio());
    return ResponseEntity.ok(UserResponse.from(user));
  }

  @PatchMapping("/{id}/profile-image")
  public ResponseEntity<UserResponse> updateProfileImage(
      @PathVariable Long id, @RequestParam Long profileImageId) {
    User user = userService.updateProfileImage(id, profileImageId);
    return ResponseEntity.ok(UserResponse.from(user));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> withdrawUser(@PathVariable Long id) {
    userService.withdrawUser(id);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/check-email")
  public ResponseEntity<Boolean> checkEmailExists(@RequestParam String email) {
    return ResponseEntity.ok(userService.existsByEmail(email));
  }

  @GetMapping("/check-nickname")
  public ResponseEntity<Boolean> checkNicknameExists(@RequestParam String nickname) {
    return ResponseEntity.ok(userService.existsByNickname(nickname));
  }
}
