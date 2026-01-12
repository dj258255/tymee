package io.github.beom.user.dto;

import io.github.beom.user.domain.vo.Language;
import io.github.beom.user.domain.vo.ThemeMode;
import io.github.beom.user.dto.validation.ValidEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/**
 * 사용자 설정 수정 요청 DTO (알림 설정 제외).
 *
 * <p>PATCH 요청을 위해 모든 필드가 Optional(null 허용). null이 아닌 필드만 업데이트.
 */
public record UserSettingsUpdateRequest(
    // 앱 설정
    @Schema(example = "DARK")
        @ValidEnum(
            enumClass = ThemeMode.class,
            message = "theme_mode는 LIGHT, DARK, SYSTEM 중 하나여야 합니다")
        String themeMode,
    @Schema(example = "KO")
        @ValidEnum(enumClass = Language.class, message = "language는 KO, JA, EN 중 하나여야 합니다")
        String language,

    // 개인정보 설정
    @Schema(example = "true") Boolean privacyProfilePublic,
    @Schema(example = "true") Boolean privacyStudyPublic,
    @Schema(example = "true") Boolean privacyAllowFriendRequest,

    // 플래너 설정
    @Schema(example = "6")
        @Min(value = 0, message = "planner_start_hour는 0 이상이어야 합니다")
        @Max(value = 23, message = "planner_start_hour는 23 이하여야 합니다")
        Integer plannerStartHour,
    @Schema(example = "360")
        @Min(value = 0, message = "daily_goal_minutes는 0 이상이어야 합니다")
        @Max(value = 1440, message = "daily_goal_minutes는 1440 이하여야 합니다")
        Integer dailyGoalMinutes,
    @Schema(example = "2100")
        @Min(value = 0, message = "weekly_goal_minutes는 0 이상이어야 합니다")
        @Max(value = 10080, message = "weekly_goal_minutes는 10080 이하여야 합니다")
        Integer weeklyGoalMinutes,
    @Schema(example = "true") Boolean weeklyTimetableEnabled) {}
