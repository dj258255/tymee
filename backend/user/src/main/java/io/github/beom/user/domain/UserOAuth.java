package io.github.beom.user.domain;

import io.github.beom.user.domain.vo.OAuthProvider;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
public class UserOAuth {

  private final Long id;
  private final Long userId;
  private final OAuthProvider provider;
  private final String providerId;
  private final LocalDateTime createdAt;
  private LocalDateTime deletedAt;

  @Builder
  private UserOAuth(
      Long id,
      Long userId,
      OAuthProvider provider,
      String providerId,
      LocalDateTime createdAt,
      LocalDateTime deletedAt) {
    this.id = id;
    this.userId = userId;
    this.provider = provider;
    this.providerId = providerId;
    this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
    this.deletedAt = deletedAt;
  }

  public static UserOAuth create(Long userId, OAuthProvider provider, String providerId) {
    return UserOAuth.builder().userId(userId).provider(provider).providerId(providerId).build();
  }

  public void unlink() {
    if (isUnlinked()) {
      throw new IllegalStateException("이미 해제된 OAuth 연동입니다");
    }
    this.deletedAt = LocalDateTime.now();
  }

  public boolean isUnlinked() {
    return this.deletedAt != null;
  }

  public boolean isLinked() {
    return this.deletedAt == null;
  }
}
