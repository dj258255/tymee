package io.github.beom.user.entity;

import io.github.beom.user.domain.User;
import io.github.beom.user.domain.vo.Email;
import io.github.beom.user.domain.vo.Nickname;
import io.github.beom.user.domain.vo.StudyTime;
import io.github.beom.user.domain.vo.UserRole;
import io.github.beom.user.domain.vo.UserStatus;
import io.github.beom.user.domain.vo.UserTier;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class UserEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true)
  private String email;

  @Column private String password;

  @Column(nullable = false, length = 50)
  private String nickname;

  @Column(name = "profile_image_id")
  private Long profileImageId;

  @Column(columnDefinition = "TEXT")
  private String bio;

  @Column private Integer level;

  @Enumerated(EnumType.STRING)
  @Column(length = 20)
  private UserTier tier;

  @Column(name = "total_study_minutes")
  private Long totalStudyMinutes;

  @Enumerated(EnumType.STRING)
  @Column(length = 20)
  private UserStatus status;

  @Enumerated(EnumType.STRING)
  @Column(length = 20)
  private UserRole role;

  @Column(name = "last_login_at")
  private LocalDateTime lastLoginAt;

  @Column(name = "last_active_at")
  private LocalDateTime lastActiveAt;

  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at")
  private LocalDateTime updatedAt;

  @Column(name = "deleted_at")
  private LocalDateTime deletedAt;

  @PrePersist
  protected void onCreate() {
    this.createdAt = LocalDateTime.now();
    this.updatedAt = LocalDateTime.now();
    if (this.tier == null) {
      this.tier = UserTier.ELEMENTARY;
    }
    if (this.status == null) {
      this.status = UserStatus.ACTIVE;
    }
    if (this.role == null) {
      this.role = UserRole.USER;
    }
    if (this.totalStudyMinutes == null) {
      this.totalStudyMinutes = 0L;
    }
  }

  @PreUpdate
  protected void onUpdate() {
    this.updatedAt = LocalDateTime.now();
  }

  public static UserEntity from(User user) {
    return UserEntity.builder()
        .id(user.getId())
        .email(user.getEmail().value())
        .password(user.getPassword())
        .nickname(user.getNickname().value())
        .profileImageId(user.getProfileImageId())
        .bio(user.getBio())
        .level(user.getLevel())
        .tier(user.getTier())
        .totalStudyMinutes(user.getTotalStudyMinutes())
        .status(user.getStatus())
        .role(user.getRole())
        .lastLoginAt(user.getLastLoginAt())
        .lastActiveAt(user.getLastActiveAt())
        .createdAt(user.getCreatedAt())
        .updatedAt(user.getUpdatedAt())
        .deletedAt(user.getDeletedAt())
        .build();
  }

  public User toDomain() {
    return User.builder()
        .id(this.id)
        .email(new Email(this.email))
        .password(this.password)
        .nickname(new Nickname(this.nickname))
        .profileImageId(this.profileImageId)
        .bio(this.bio)
        .level(this.level)
        .tier(this.tier)
        .studyTime(new StudyTime(this.totalStudyMinutes != null ? this.totalStudyMinutes : 0L))
        .status(this.status)
        .role(this.role)
        .lastLoginAt(this.lastLoginAt)
        .lastActiveAt(this.lastActiveAt)
        .createdAt(this.createdAt)
        .updatedAt(this.updatedAt)
        .deletedAt(this.deletedAt)
        .build();
  }
}
