package io.github.beom.user.entity;

import io.github.beom.user.domain.UserNotificationSettings;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "user_notification_settings")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class UserNotificationSettingsEntity {

  @Id
  @Column(name = "user_id")
  private Long userId;

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
  }

  /** Domain → Entity 변환. */
  public static UserNotificationSettingsEntity from(UserNotificationSettings domain) {
    return UserNotificationSettingsEntity.builder()
        .userId(domain.getUserId())
        .pushEnabled(domain.isPushEnabled())
        .pushFriendRequest(domain.isPushFriendRequest())
        .pushChatMessage(domain.isPushChatMessage())
        .pushPostComment(domain.isPushPostComment())
        .pushLike(domain.isPushLike())
        .pushGroupActivity(domain.isPushGroupActivity())
        .pushPopularPost(domain.isPushPopularPost())
        .pushDailyTaskEnabled(domain.isPushDailyTaskEnabled())
        .pushDailyTaskTime(domain.getPushDailyTaskTime())
        .pushTimeBlockEnabled(domain.isPushTimeBlockEnabled())
        .pushTimeBlockMinutesBefore(domain.getPushTimeBlockMinutesBefore())
        .createdAt(domain.getCreatedAt())
        .updatedAt(domain.getUpdatedAt())
        .build();
  }

  /** Entity → Domain 변환. */
  public UserNotificationSettings toDomain() {
    return UserNotificationSettings.builder()
        .userId(this.userId)
        .pushEnabled(this.pushEnabled)
        .pushFriendRequest(this.pushFriendRequest)
        .pushChatMessage(this.pushChatMessage)
        .pushPostComment(this.pushPostComment)
        .pushLike(this.pushLike)
        .pushGroupActivity(this.pushGroupActivity)
        .pushPopularPost(this.pushPopularPost)
        .pushDailyTaskEnabled(this.pushDailyTaskEnabled)
        .pushDailyTaskTime(this.pushDailyTaskTime)
        .pushTimeBlockEnabled(this.pushTimeBlockEnabled)
        .pushTimeBlockMinutesBefore(this.pushTimeBlockMinutesBefore)
        .createdAt(this.createdAt)
        .updatedAt(this.updatedAt)
        .build();
  }
}
