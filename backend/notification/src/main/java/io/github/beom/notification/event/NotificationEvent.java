package io.github.beom.notification.event;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * 알림 이벤트 DTO.
 *
 * <p>RabbitMQ를 통해 전송되는 알림 메시지
 *
 * @param id 이벤트 고유 ID
 * @param userId 대상 사용자 ID
 * @param type 알림 유형
 * @param title 알림 제목
 * @param body 알림 본문
 * @param data 추가 데이터 (앱에서 처리할 정보)
 * @param createdAt 생성 시각
 */
public record NotificationEvent(
    String id,
    Long userId,
    NotificationType type,
    String title,
    String body,
    Map<String, Object> data,
    LocalDateTime createdAt)
    implements Serializable {

  /** 새 알림 이벤트 생성 */
  public static NotificationEvent create(
      Long userId, NotificationType type, String title, String body, Map<String, Object> data) {
    return new NotificationEvent(
        java.util.UUID.randomUUID().toString(),
        userId,
        type,
        title,
        body,
        data,
        LocalDateTime.now());
  }

  /** 타임블록 알림 이벤트 생성 */
  public static NotificationEvent timeBlockReminder(
      Long userId, String subjectName, String startTime) {
    return create(
        userId,
        NotificationType.TIME_BLOCK_REMINDER,
        "학습 시간 알림",
        String.format("%s 학습이 %s에 시작됩니다.", subjectName, startTime),
        Map.of("subjectName", subjectName, "startTime", startTime));
  }

  /** 학습 완료 알림 이벤트 생성 */
  public static NotificationEvent studyComplete(
      Long userId, String subjectName, int durationMinutes) {
    return create(
        userId,
        NotificationType.STUDY_COMPLETE,
        "학습 완료",
        String.format("%s 학습을 %d분간 완료했습니다.", subjectName, durationMinutes),
        Map.of("subjectName", subjectName, "durationMinutes", durationMinutes));
  }
}
