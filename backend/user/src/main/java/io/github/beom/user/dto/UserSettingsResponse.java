package io.github.beom.user.dto;

import io.github.beom.user.domain.UserSettings;
import lombok.Builder;

/** 사용자 설정 응답 DTO (알림 설정 제외). */
@Builder
public record UserSettingsResponse(
    // 앱 설정
    String themeMode,
    String language,
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
