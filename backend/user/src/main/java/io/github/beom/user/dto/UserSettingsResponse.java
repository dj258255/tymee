package io.github.beom.user.dto;

import io.github.beom.user.domain.UserSettings;
import java.time.LocalTime;
import lombok.Builder;

/** 사용자 설정 응답 DTO. */
@Builder
public record UserSettingsResponse(
    // 앱 설정
    String themeMode,
    String language,
    // 푸시 알림 설정
    boolean pushEnabled,
    boolean pushFriendRequest,
    boolean pushChatMessage,
    boolean pushPostComment,
    boolean pushLike,
    boolean pushGroupActivity,
    boolean pushPopularPost,
    // 일일 할일 알림 설정
    boolean pushDailyTaskEnabled,
    LocalTime pushDailyTaskTime,
    // 시간표 알림 설정
    boolean pushTimeBlockEnabled,
    int pushTimeBlockMinutesBefore,
    // 개인정보 설정
    boolean privacyProfilePublic,
    boolean privacyStudyPublic,
    boolean privacyAllowFriendRequest,
    // 플래너 설정
    int plannerStartHour,
    int dailyGoalMinutes,
    int weeklyGoalMinutes,
    boolean weeklyTimetableEnabled) {

  public static UserSettingsResponse from(UserSettings settings) {
    return UserSettingsResponse.builder()
        .themeMode(settings.getThemeMode().name())
        .language(settings.getLanguage().name())
        .pushEnabled(settings.isPushEnabled())
        .pushFriendRequest(settings.isPushFriendRequest())
        .pushChatMessage(settings.isPushChatMessage())
        .pushPostComment(settings.isPushPostComment())
        .pushLike(settings.isPushLike())
        .pushGroupActivity(settings.isPushGroupActivity())
        .pushPopularPost(settings.isPushPopularPost())
        .pushDailyTaskEnabled(settings.isPushDailyTaskEnabled())
        .pushDailyTaskTime(settings.getPushDailyTaskTime())
        .pushTimeBlockEnabled(settings.isPushTimeBlockEnabled())
        .pushTimeBlockMinutesBefore(settings.getPushTimeBlockMinutesBefore())
        .privacyProfilePublic(settings.isPrivacyProfilePublic())
        .privacyStudyPublic(settings.isPrivacyStudyPublic())
        .privacyAllowFriendRequest(settings.isPrivacyAllowFriendRequest())
        .plannerStartHour(settings.getPlannerStartHour())
        .dailyGoalMinutes(settings.getDailyGoalMinutes())
        .weeklyGoalMinutes(settings.getWeeklyGoalMinutes())
        .weeklyTimetableEnabled(settings.isWeeklyTimetableEnabled())
        .build();
  }
}
