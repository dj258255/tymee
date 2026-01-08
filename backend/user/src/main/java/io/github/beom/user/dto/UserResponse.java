package io.github.beom.user.dto;

import io.github.beom.user.domain.User;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record UserResponse(
    Long id,
    String email,
    String nickname,
    Long profileImageId,
    String bio,
    Integer level,
    String tier,
    Long totalStudyMinutes,
    String status,
    String role,
    LocalDateTime lastLoginAt,
    LocalDateTime lastActiveAt,
    LocalDateTime createdAt) {
  public static UserResponse from(User user) {
    return UserResponse.builder()
        .id(user.getId())
        .email(user.getEmail().value())
        .nickname(user.getDisplayName())
        .profileImageId(user.getProfileImageId())
        .bio(user.getBio())
        .level(user.getLevel())
        .tier(user.getTier().getCode())
        .totalStudyMinutes(user.getTotalStudyMinutes())
        .status(user.getStatus().getCode())
        .role(user.getRole().getCode())
        .lastLoginAt(user.getLastLoginAt())
        .lastActiveAt(user.getLastActiveAt())
        .createdAt(user.getCreatedAt())
        .build();
  }
}
