package io.github.beom.user.dto;

import io.github.beom.user.domain.User;
import lombok.Builder;

@Builder
public record UserProfileResponse(
    Long id,
    String nickname,
    Long profileImageId,
    String bio,
    Integer level,
    String tier,
    Long totalStudyMinutes) {
  public static UserProfileResponse from(User user) {
    return UserProfileResponse.builder()
        .id(user.getId())
        .nickname(user.getDisplayName())
        .profileImageId(user.getProfileImageId())
        .bio(user.getBio())
        .level(user.getLevel())
        .tier(user.getTier().name())
        .totalStudyMinutes(user.getTotalStudyMinutes())
        .build();
  }
}
