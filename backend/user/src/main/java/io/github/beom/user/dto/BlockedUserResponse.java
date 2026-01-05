package io.github.beom.user.dto;

import io.github.beom.user.domain.User;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record BlockedUserResponse(
    Long userId, String nickname, Long profileImageId, LocalDateTime blockedAt) {

  public static BlockedUserResponse of(User user, LocalDateTime blockedAt) {
    return BlockedUserResponse.builder()
        .userId(user.getId())
        .nickname(user.getNickname().value())
        .profileImageId(user.getProfileImageId())
        .blockedAt(blockedAt)
        .build();
  }
}
