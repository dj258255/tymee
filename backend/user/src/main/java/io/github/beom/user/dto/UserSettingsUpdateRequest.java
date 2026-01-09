package io.github.beom.user.dto;

import io.github.beom.user.domain.vo.Language;
import io.github.beom.user.domain.vo.ThemeMode;
import io.github.beom.user.dto.validation.ValidEnum;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.time.LocalTime;

/**
 * 사용자 설정 수정 요청 DTO.
 *
 * <p>PATCH 요청을 위해 모든 필드가 Optional(null 허용). null이 아닌 필드만 업데이트.
 */
public record UserSettingsUpdateRequest(
    // 앱 설정
    @ValidEnum(enumClass = ThemeMode.class, message = "theme_mode는 LIGHT, DARK, SYSTEM 중 하나여야 합니다")
        String themeMode,
    @ValidEnum(enumClass = Language.class, message = "language는 KO, JA, EN 중 하나여야 합니다")
        String language,

    // 푸시 알림 설정
    Boolean pushEnabled,
    Boolean pushFriendRequest,
    Boolean pushChatMessage,
    Boolean pushPostComment,
    Boolean pushLike,
    Boolean pushGroupActivity,
    Boolean pushPopularPost,

    // 일일 할일 알림 설정
    Boolean pushDailyTaskEnabled,
    LocalTime pushDailyTaskTime,

    // 시간표 알림 설정
    Boolean pushTimeBlockEnabled,
    @Min(value = 0, message = "알림 시간은 0분 이상이어야 합니다")
        @Max(value = 60, message = "알림 시간은 60분 이하여야 합니다")
        Integer pushTimeBlockMinutesBefore,

    // 개인정보 설정
    Boolean privacyProfilePublic,
    Boolean privacyStudyPublic,
    Boolean privacyAllowFriendRequest,

    // 플래너 설정
    @Min(value = 0, message = "planner_start_hour는 0 이상이어야 합니다")
        @Max(value = 23, message = "planner_start_hour는 23 이하여야 합니다")
        Integer plannerStartHour,
    @Min(value = 0, message = "daily_goal_minutes는 0 이상이어야 합니다")
        @Max(value = 1440, message = "daily_goal_minutes는 1440 이하여야 합니다")
        Integer dailyGoalMinutes,
    @Min(value = 0, message = "weekly_goal_minutes는 0 이상이어야 합니다")
        @Max(value = 10080, message = "weekly_goal_minutes는 10080 이하여야 합니다")
        Integer weeklyGoalMinutes,
    Boolean weeklyTimetableEnabled) {}
