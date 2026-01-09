package io.github.beom.user.entity;

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
import java.time.LocalTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

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

  @Column(name = "push_enabled")
  private Boolean pushEnabled;

  @Column(name = "push_friend_request")
  private Boolean pushFriendRequest;

  @Column(name = "push_chat_message")
  private Boolean pushChatMessage;

  @Column(name = "push_post_comment")
  private Boolean pushPostComment;

  @Column(name = "push_like")
  private Boolean pushLike;

  @Column(name = "push_group_activity")
  private Boolean pushGroupActivity;

  @Column(name = "push_popular_post")
  private Boolean pushPopularPost;

  @Column(name = "push_daily_task_enabled")
  private Boolean pushDailyTaskEnabled;

  @Column(name = "push_daily_task_time")
  private LocalTime pushDailyTaskTime;

  @Column(name = "push_time_block_enabled")
  private Boolean pushTimeBlockEnabled;

  @Column(name = "push_time_block_minutes_before")
  private Integer pushTimeBlockMinutesBefore;

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
    if (this.pushEnabled == null) {
      this.pushEnabled = true;
    }
    if (this.pushFriendRequest == null) {
      this.pushFriendRequest = true;
    }
    if (this.pushChatMessage == null) {
      this.pushChatMessage = true;
    }
    if (this.pushPostComment == null) {
      this.pushPostComment = true;
    }
    if (this.pushLike == null) {
      this.pushLike = true;
    }
    if (this.pushGroupActivity == null) {
      this.pushGroupActivity = true;
    }
    if (this.pushPopularPost == null) {
      this.pushPopularPost = true;
    }
    if (this.pushDailyTaskEnabled == null) {
      this.pushDailyTaskEnabled = true;
    }
    if (this.pushDailyTaskTime == null) {
      this.pushDailyTaskTime = LocalTime.of(8, 0);
    }
    if (this.pushTimeBlockEnabled == null) {
      this.pushTimeBlockEnabled = true;
    }
    if (this.pushTimeBlockMinutesBefore == null) {
      this.pushTimeBlockMinutesBefore = 10;
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
}
