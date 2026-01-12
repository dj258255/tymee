package io.github.beom.user.service;

import io.github.beom.user.domain.UserNotificationSettings;
import io.github.beom.user.dto.UserNotificationSettingsUpdateRequest;
import io.github.beom.user.repository.UserNotificationSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 사용자 알림 설정 서비스. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserNotificationSettingsService {

  private final UserNotificationSettingsRepository repository;

  /**
   * 사용자 알림 설정 조회. 설정이 없으면 기본값으로 자동 생성.
   *
   * @param userId 사용자 ID
   * @return 사용자 알림 설정
   */
  @Transactional
  public UserNotificationSettings getSettings(Long userId) {
    return repository.findOrCreateByUserId(userId);
  }

  /**
   * 사용자 알림 설정 부분 업데이트.
   *
   * @param userId 사용자 ID
   * @param request 업데이트 요청 (null인 필드는 무시)
   * @return 업데이트된 설정
   */
  @Transactional
  public UserNotificationSettings updateSettings(
      Long userId, UserNotificationSettingsUpdateRequest request) {
    UserNotificationSettings settings = repository.findOrCreateByUserId(userId);
    applyUpdates(request, settings);
    return repository.save(settings);
  }

  /**
   * 신규 사용자의 기본 알림 설정 생성.
   *
   * @param userId 사용자 ID
   * @return 생성된 기본 설정
   */
  @Transactional
  public UserNotificationSettings createDefaultSettings(Long userId) {
    return repository.findOrCreateByUserId(userId);
  }

  private void applyUpdates(
      UserNotificationSettingsUpdateRequest request, UserNotificationSettings settings) {
    // 푸시 알림 전체 on/off
    if (request.pushEnabled() != null) {
      settings.updatePushEnabled(request.pushEnabled());
    }

    // 푸시 알림 개별 설정
    if (hasPushSettingsUpdate(request)) {
      settings.updatePushSettings(
          getOrDefault(request.pushFriendRequest(), settings.isPushFriendRequest()),
          getOrDefault(request.pushChatMessage(), settings.isPushChatMessage()),
          getOrDefault(request.pushPostComment(), settings.isPushPostComment()),
          getOrDefault(request.pushLike(), settings.isPushLike()),
          getOrDefault(request.pushGroupActivity(), settings.isPushGroupActivity()),
          getOrDefault(request.pushPopularPost(), settings.isPushPopularPost()));
    }

    // 일일 할일 알림 설정
    if (request.pushDailyTaskEnabled() != null || request.pushDailyTaskTime() != null) {
      settings.updateDailyTaskPush(
          getOrDefault(request.pushDailyTaskEnabled(), settings.isPushDailyTaskEnabled()),
          request.pushDailyTaskTime() != null
              ? request.pushDailyTaskTime()
              : settings.getPushDailyTaskTime());
    }

    // 시간표 알림 설정
    if (request.pushTimeBlockEnabled() != null || request.pushTimeBlockMinutesBefore() != null) {
      settings.updateTimeBlockPush(
          getOrDefault(request.pushTimeBlockEnabled(), settings.isPushTimeBlockEnabled()),
          getOrDefault(
              request.pushTimeBlockMinutesBefore(), settings.getPushTimeBlockMinutesBefore()));
    }
  }

  private static boolean hasPushSettingsUpdate(UserNotificationSettingsUpdateRequest request) {
    return request.pushFriendRequest() != null
        || request.pushChatMessage() != null
        || request.pushPostComment() != null
        || request.pushLike() != null
        || request.pushGroupActivity() != null
        || request.pushPopularPost() != null;
  }

  private static <T> T getOrDefault(T value, T defaultValue) {
    return value != null ? value : defaultValue;
  }
}
