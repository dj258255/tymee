package io.github.beom.user.domain;

import java.time.LocalDateTime;
import java.time.LocalTime;
import lombok.Builder;
import lombok.Getter;

/** 사용자 알림 설정 도메인. */
@Getter
public class UserNotificationSettings {

  private final Long userId;

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

  private final LocalDateTime createdAt;
  private LocalDateTime updatedAt;

  @Builder
  private UserNotificationSettings(
      Long userId,
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
      LocalDateTime createdAt,
      LocalDateTime updatedAt) {
    this.userId = userId;
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
    this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
    this.updatedAt = updatedAt;
  }

  /** 새 사용자의 기본 알림 설정 생성. */
  public static UserNotificationSettings createDefault(Long userId) {
    return UserNotificationSettings.builder().userId(userId).build();
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
}
