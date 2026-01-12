package io.github.beom.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.time.LocalTime;

/**
 * 사용자 알림 설정 수정 요청 DTO.
 *
 * <p>PATCH 요청을 위해 모든 필드가 Optional(null 허용). null이 아닌 필드만 업데이트.
 */
public record UserNotificationSettingsUpdateRequest(
    // 푸시 알림 설정
    @Schema(example = "true") Boolean pushEnabled,
    @Schema(example = "true") Boolean pushFriendRequest,
    @Schema(example = "true") Boolean pushChatMessage,
    @Schema(example = "true") Boolean pushPostComment,
    @Schema(example = "true") Boolean pushLike,
    @Schema(example = "true") Boolean pushGroupActivity,
    @Schema(example = "false") Boolean pushPopularPost,

    // 일일 할일 알림 설정
    @Schema(example = "true") Boolean pushDailyTaskEnabled,
    @Schema(type = "string", example = "08:00") LocalTime pushDailyTaskTime,

    // 시간표 알림 설정
    @Schema(example = "true") Boolean pushTimeBlockEnabled,
    @Schema(example = "10")
        @Min(value = 0, message = "알림 시간은 0분 이상이어야 합니다")
        @Max(value = 60, message = "알림 시간은 60분 이하여야 합니다")
        Integer pushTimeBlockMinutesBefore) {}
