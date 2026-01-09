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

  /** OAuth 사용자 생성. 닉네임은 랜덤 생성 (형용사+명사+숫자). */
  public static User createOAuthUser(Email email) {
    return User.builder().email(email).nickname(Nickname.generateRandom()).build();
  }

  /** 표시용 이름. 닉네임이 있으면 닉네임, 없으면 이메일 로컬파트. */
  public String getDisplayName() {
    if (nickname != null && !nickname.isEmpty()) {
      return nickname.value();
    }
    if (email != null) {
      String emailValue = email.value();
      int atIndex = emailValue.indexOf('@');
      return atIndex > 0 ? emailValue.substring(0, atIndex) : emailValue;
    }
    return "사용자";
  }

  /** 닉네임 설정 여부. */
  public boolean hasNickname() {
    return nickname != null && !nickname.isEmpty();
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
    this.deletedAt = null; // 탈퇴 복구 시 deletedAt 초기화
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

  public boolean isActive() {
    return this.status.isActive();
  }

  public boolean isDeleted() {
    return this.deletedAt != null || this.status == UserStatus.WITHDRAWN;
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
