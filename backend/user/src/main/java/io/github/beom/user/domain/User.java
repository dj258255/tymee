package io.github.beom.user.domain;

import io.github.beom.user.domain.vo.Email;
import io.github.beom.user.domain.vo.Nickname;
import io.github.beom.user.domain.vo.StudyTime;
import io.github.beom.user.domain.vo.UserRole;
import io.github.beom.user.domain.vo.UserStatus;
import io.github.beom.user.domain.vo.UserTier;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
public class User {

  private final Long id;
  private final Email email;
  private String password;
  private Nickname nickname;
  private Long profileImageId;
  private String bio;
  private Integer level;
  private UserTier tier;
  private StudyTime studyTime;
  private UserStatus status;
  private UserRole role;
  private LocalDateTime lastLoginAt;
  private LocalDateTime lastActiveAt;
  private final LocalDateTime createdAt;
  private LocalDateTime updatedAt;
  private LocalDateTime deletedAt;

  @Builder
  private User(
      Long id,
      Email email,
      String password,
      Nickname nickname,
      Long profileImageId,
      String bio,
      Integer level,
      UserTier tier,
      StudyTime studyTime,
      UserStatus status,
      UserRole role,
      LocalDateTime lastLoginAt,
      LocalDateTime lastActiveAt,
      LocalDateTime createdAt,
      LocalDateTime updatedAt,
      LocalDateTime deletedAt) {
    this.id = id;
    this.email = email;
    this.password = password;
    this.nickname = nickname;
    this.profileImageId = profileImageId;
    this.bio = bio;
    this.level = level;
    this.tier = tier != null ? tier : UserTier.ELEMENTARY;
    this.studyTime = studyTime != null ? studyTime : StudyTime.zero();
    this.status = status != null ? status : UserStatus.ACTIVE;
    this.role = role != null ? role : UserRole.USER;
    this.lastLoginAt = lastLoginAt;
    this.lastActiveAt = lastActiveAt;
    this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
    this.updatedAt = updatedAt;
    this.deletedAt = deletedAt;
  }

  public static User create(Email email, String password, Nickname nickname) {
    return User.builder().email(email).password(password).nickname(nickname).build();
  }

  public static User createOAuthUser(Email email, Nickname nickname) {
    return User.builder().email(email).password(null).nickname(nickname).build();
  }

  public void updateProfile(Nickname nickname, String bio) {
    this.nickname = nickname;
    this.bio = bio;
    this.updatedAt = LocalDateTime.now();
  }

  public void updateProfileImage(Long profileImageId) {
    this.profileImageId = profileImageId;
    this.updatedAt = LocalDateTime.now();
  }

  public void addStudyMinutes(long minutes) {
    this.studyTime = this.studyTime.add(minutes);
    this.tier = this.studyTime.calculateTier();
    this.updatedAt = LocalDateTime.now();
  }

  public void updateLastLogin() {
    this.lastLoginAt = LocalDateTime.now();
  }

  public void updateLastActive() {
    this.lastActiveAt = LocalDateTime.now();
  }

  public void suspend() {
    validateActiveStatus();
    this.status = UserStatus.SUSPENDED;
    this.updatedAt = LocalDateTime.now();
  }

  public void ban() {
    this.status = UserStatus.BANNED;
    this.updatedAt = LocalDateTime.now();
  }

  public void activate() {
    this.status = UserStatus.ACTIVE;
    this.updatedAt = LocalDateTime.now();
  }

  public void withdraw() {
    validateActiveStatus();
    this.status = UserStatus.WITHDRAWN;
    this.deletedAt = LocalDateTime.now();
    this.updatedAt = LocalDateTime.now();
  }

  public void changeRole(UserRole role) {
    this.role = role;
    this.updatedAt = LocalDateTime.now();
  }

  public void changePassword(String newPassword) {
    if (isOAuthUser()) {
      throw new IllegalStateException("OAuth 사용자는 비밀번호를 변경할 수 없습니다");
    }
    this.password = newPassword;
    this.updatedAt = LocalDateTime.now();
  }

  public boolean isActive() {
    return this.status.isActive();
  }

  public boolean isOAuthUser() {
    return this.password == null;
  }

  public boolean isDeleted() {
    return this.deletedAt != null;
  }

  public boolean canLogin() {
    return this.status.canLogin() && !isDeleted();
  }

  public long getTotalStudyMinutes() {
    return this.studyTime.totalMinutes();
  }

  private void validateActiveStatus() {
    if (this.status == UserStatus.WITHDRAWN) {
      throw new IllegalStateException("이미 탈퇴한 사용자입니다");
    }
  }
}
