package io.github.beom.user.entity;

import io.github.beom.user.domain.UserSettings;
import io.github.beom.user.domain.vo.Language;
import io.github.beom.user.domain.vo.ThemeMode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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

/** 사용자 설정 엔티티 (알림 설정 제외). */
@Entity
@Table(name = "user_settings")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class UserSettingsEntity {

  private static final String DEFAULT_LANGUAGE = "ko";

  @Id
  @Column(name = "user_id")
  private Long userId;

  @Enumerated(EnumType.STRING)
  @Column(name = "theme_mode", length = 20)
  private ThemeMode themeMode;

  @Column(length = 10)
  private String language;

  @Column(name = "privacy_profile_public")
  private Boolean privacyProfilePublic;

  @Column(name = "privacy_study_public")
  private Boolean privacyStudyPublic;

  @Column(name = "privacy_allow_friend_request")
  private Boolean privacyAllowFriendRequest;

  @Column(name = "planner_start_hour")
  private Integer plannerStartHour;

  @Column(name = "daily_goal_minutes")
  private Integer dailyGoalMinutes;

  @Column(name = "weekly_goal_minutes")
  private Integer weeklyGoalMinutes;

  @Column(name = "weekly_timetable_enabled")
  private Boolean weeklyTimetableEnabled;

  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at")
  private LocalDateTime updatedAt;

  @PrePersist
  protected void onCreate() {
    this.createdAt = LocalDateTime.now();
    this.updatedAt = LocalDateTime.now();
    setDefaults();
  }

  @PreUpdate
  protected void onUpdate() {
    this.updatedAt = LocalDateTime.now();
  }

  private void setDefaults() {
    if (this.themeMode == null) {
      this.themeMode = ThemeMode.SYSTEM;
    }
    if (this.language == null) {
      this.language = DEFAULT_LANGUAGE;
    }
    if (this.privacyProfilePublic == null) {
      this.privacyProfilePublic = true;
    }
    if (this.privacyStudyPublic == null) {
      this.privacyStudyPublic = true;
    }
    if (this.privacyAllowFriendRequest == null) {
      this.privacyAllowFriendRequest = true;
    }
    if (this.plannerStartHour == null) {
      this.plannerStartHour = 6;
    }
    if (this.dailyGoalMinutes == null) {
      this.dailyGoalMinutes = 180;
    }
    if (this.weeklyGoalMinutes == null) {
      this.weeklyGoalMinutes = 1260;
    }
    if (this.weeklyTimetableEnabled == null) {
      this.weeklyTimetableEnabled = false;
    }
  }

  /** Domain → Entity 변환. */
  public static UserSettingsEntity from(UserSettings domain) {
    return UserSettingsEntity.builder()
        .userId(domain.getUserId())
        .themeMode(domain.getThemeMode())
        .language(domain.getLanguage().name())
        .privacyProfilePublic(domain.isPrivacyProfilePublic())
        .privacyStudyPublic(domain.isPrivacyStudyPublic())
        .privacyAllowFriendRequest(domain.isPrivacyAllowFriendRequest())
        .plannerStartHour(domain.getPlannerStartHour())
        .dailyGoalMinutes(domain.getDailyGoalMinutes())
        .weeklyGoalMinutes(domain.getWeeklyGoalMinutes())
        .weeklyTimetableEnabled(domain.isWeeklyTimetableEnabled())
        .createdAt(domain.getCreatedAt())
        .updatedAt(domain.getUpdatedAt())
        .build();
  }

  /** Entity → Domain 변환. */
  public UserSettings toDomain() {
    return UserSettings.builder()
        .userId(this.userId)
        .themeMode(this.themeMode)
        .language(this.language != null ? Language.valueOf(this.language.toUpperCase()) : null)
        .privacyProfilePublic(this.privacyProfilePublic)
        .privacyStudyPublic(this.privacyStudyPublic)
        .privacyAllowFriendRequest(this.privacyAllowFriendRequest)
        .plannerStartHour(this.plannerStartHour)
        .dailyGoalMinutes(this.dailyGoalMinutes)
        .weeklyGoalMinutes(this.weeklyGoalMinutes)
        .weeklyTimetableEnabled(this.weeklyTimetableEnabled)
        .createdAt(this.createdAt)
        .updatedAt(this.updatedAt)
        .build();
  }
}
