package io.github.beom.user.domain;

import io.github.beom.user.domain.vo.Language;
import io.github.beom.user.domain.vo.ThemeMode;
import java.time.LocalDateTime;
import java.time.LocalTime;
import lombok.Builder;
import lombok.Getter;

/** 사용자 설정 도메인. */
@Getter
public class UserSettings {

  private final Long userId;

  // 앱 설정
  private ThemeMode themeMode;
  private Language language;

  // 푸시 알림 설정
  private boolean pushEnabled;
  private boolean pushFriendRequest;
  private boolean pushChatMessage;
  private boolean pushPostComment;
  private boolean pushLike;
  private boolean pushGroupActivity;
  private boolean pushPopularPost;

  // 일일 할일 알림 설정
  private boolean pushDailyTaskEnabled;
  private LocalTime pushDailyTaskTime;

  // 시간표 알림 설정
  private boolean pushTimeBlockEnabled;
  private int pushTimeBlockMinutesBefore;

  // 개인정보 설정
  private boolean privacyProfilePublic;
  private boolean privacyStudyPublic;
  private boolean privacyAllowFriendRequest;

  // 플래너 설정
  private int plannerStartHour;
  private int dailyGoalMinutes;
  private int weeklyGoalMinutes;
  private boolean weeklyTimetableEnabled;

  private final LocalDateTime createdAt;
  private LocalDateTime updatedAt;

  @Builder
  private UserSettings(
      Long userId,
      ThemeMode themeMode,
      Language language,
      Boolean pushEnabled,
      Boolean pushFriendRequest,
      Boolean pushChatMessage,
      Boolean pushPostComment,
      Boolean pushLike,
      Boolean pushGroupActivity,
      Boolean pushPopularPost,
      Boolean pushDailyTaskEnabled,
      LocalTime pushDailyTaskTime,
      Boolean pushTimeBlockEnabled,
      Integer pushTimeBlockMinutesBefore,
      Boolean privacyProfilePublic,
      Boolean privacyStudyPublic,
      Boolean privacyAllowFriendRequest,
      Integer plannerStartHour,
      Integer dailyGoalMinutes,
      Integer weeklyGoalMinutes,
      Boolean weeklyTimetableEnabled,
      LocalDateTime createdAt,
      LocalDateTime updatedAt) {
    this.userId = userId;
    this.themeMode = themeMode != null ? themeMode : ThemeMode.SYSTEM;
    this.language = language != null ? language : Language.KO;
    this.pushEnabled = pushEnabled != null ? pushEnabled : true;
    this.pushFriendRequest = pushFriendRequest != null ? pushFriendRequest : true;
    this.pushChatMessage = pushChatMessage != null ? pushChatMessage : true;
    this.pushPostComment = pushPostComment != null ? pushPostComment : true;
    this.pushLike = pushLike != null ? pushLike : true;
    this.pushGroupActivity = pushGroupActivity != null ? pushGroupActivity : true;
    this.pushPopularPost = pushPopularPost != null ? pushPopularPost : true;
    this.pushDailyTaskEnabled = pushDailyTaskEnabled != null ? pushDailyTaskEnabled : true;
    this.pushDailyTaskTime = pushDailyTaskTime != null ? pushDailyTaskTime : LocalTime.of(8, 0);
    this.pushTimeBlockEnabled = pushTimeBlockEnabled != null ? pushTimeBlockEnabled : true;
    this.pushTimeBlockMinutesBefore =
        pushTimeBlockMinutesBefore != null ? pushTimeBlockMinutesBefore : 10;
    this.privacyProfilePublic = privacyProfilePublic != null ? privacyProfilePublic : true;
    this.privacyStudyPublic = privacyStudyPublic != null ? privacyStudyPublic : true;
    this.privacyAllowFriendRequest =
        privacyAllowFriendRequest != null ? privacyAllowFriendRequest : true;
    this.plannerStartHour = plannerStartHour != null ? plannerStartHour : 6;
    this.dailyGoalMinutes = dailyGoalMinutes != null ? dailyGoalMinutes : 180;
    this.weeklyGoalMinutes = weeklyGoalMinutes != null ? weeklyGoalMinutes : 1260;
    this.weeklyTimetableEnabled = weeklyTimetableEnabled != null ? weeklyTimetableEnabled : false;
    this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
    this.updatedAt = updatedAt;
  }

  /** 새 사용자의 기본 설정 생성. */
  public static UserSettings createDefault(Long userId) {
    return UserSettings.builder().userId(userId).build();
  }

  /** 테마 모드 변경. */
  public void updateThemeMode(ThemeMode themeMode) {
    this.themeMode = themeMode;
    this.updatedAt = LocalDateTime.now();
  }

  /** 언어 변경. */
  public void updateLanguage(Language language) {
    this.language = language;
    this.updatedAt = LocalDateTime.now();
  }

  /** 푸시 알림 전체 on/off. */
  public void updatePushEnabled(boolean enabled) {
    this.pushEnabled = enabled;
    this.updatedAt = LocalDateTime.now();
  }

  /** 푸시 알림 개별 설정 업데이트. */
  public void updatePushSettings(
      boolean friendRequest,
      boolean chatMessage,
      boolean postComment,
      boolean like,
      boolean groupActivity,
      boolean popularPost) {
    this.pushFriendRequest = friendRequest;
    this.pushChatMessage = chatMessage;
    this.pushPostComment = postComment;
    this.pushLike = like;
    this.pushGroupActivity = groupActivity;
    this.pushPopularPost = popularPost;
    this.updatedAt = LocalDateTime.now();
  }

  /** 일일 할일 알림 설정 업데이트. */
  public void updateDailyTaskPush(boolean enabled, LocalTime time) {
    this.pushDailyTaskEnabled = enabled;
    this.pushDailyTaskTime = time;
    this.updatedAt = LocalDateTime.now();
  }

  /** 시간표 알림 설정 업데이트. */
  public void updateTimeBlockPush(boolean enabled, int minutesBefore) {
    this.pushTimeBlockEnabled = enabled;
    this.pushTimeBlockMinutesBefore = minutesBefore;
    this.updatedAt = LocalDateTime.now();
  }

  /** 개인정보 설정 업데이트. */
  public void updatePrivacySettings(
      boolean profilePublic, boolean studyPublic, boolean allowFriendRequest) {
    this.privacyProfilePublic = profilePublic;
    this.privacyStudyPublic = studyPublic;
    this.privacyAllowFriendRequest = allowFriendRequest;
    this.updatedAt = LocalDateTime.now();
  }

  /** 플래너 설정 업데이트. */
  public void updatePlannerSettings(
      int startHour, int dailyGoal, int weeklyGoal, boolean weeklyTimetableEnabled) {
    if (startHour < 0 || startHour > 23) {
      throw new IllegalArgumentException("시작 시간은 0-23 사이여야 합니다");
    }
    if (dailyGoal < 0) {
      throw new IllegalArgumentException("일일 목표는 0 이상이어야 합니다");
    }
    if (weeklyGoal < 0) {
      throw new IllegalArgumentException("주간 목표는 0 이상이어야 합니다");
    }
    this.plannerStartHour = startHour;
    this.dailyGoalMinutes = dailyGoal;
    this.weeklyGoalMinutes = weeklyGoal;
    this.weeklyTimetableEnabled = weeklyTimetableEnabled;
    this.updatedAt = LocalDateTime.now();
  }
}
