package io.github.beom.user.dto;

import io.github.beom.user.domain.UserNotificationSettings;
import java.time.LocalTime;
import lombok.Builder;

/** 사용자 알림 설정 응답 DTO. */
@Builder
public record UserNotificationSettingsResponse(
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
    int pushTimeBlockMinutesBefore) {

  public static UserNotificationSettingsResponse from(UserNotificationSettings settings) {
    return UserNotificationSettingsResponse.builder()
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
        .build();
  }
}
