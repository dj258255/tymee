package io.github.beom.user.entity;

import io.github.beom.user.domain.UserOAuth;
import io.github.beom.user.domain.vo.OAuthProvider;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user_oauth")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class UserOAuthEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "user_id", nullable = false)
  private Long userId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private OAuthProvider provider;

  @Column(name = "provider_id", nullable = false)
  private String providerId;

  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "deleted_at")
  private LocalDateTime deletedAt;

  @PrePersist
  protected void onCreate() {
    this.createdAt = LocalDateTime.now();
  }

  public static UserOAuthEntity from(UserOAuth userOAuth) {
    return UserOAuthEntity.builder()
        .id(userOAuth.getId())
        .userId(userOAuth.getUserId())
        .provider(userOAuth.getProvider())
        .providerId(userOAuth.getProviderId())
        .createdAt(userOAuth.getCreatedAt())
        .deletedAt(userOAuth.getDeletedAt())
        .build();
  }

  public UserOAuth toDomain() {
    return UserOAuth.builder()
        .id(this.id)
        .userId(this.userId)
        .provider(this.provider)
        .providerId(this.providerId)
        .createdAt(this.createdAt)
        .deletedAt(this.deletedAt)
        .build();
  }
}
