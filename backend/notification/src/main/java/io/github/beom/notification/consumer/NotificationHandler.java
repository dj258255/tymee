package io.github.beom.notification.consumer;

import io.github.beom.notification.event.NotificationEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 알림 처리 핸들러.
 *
 * <p>실제 푸시 알림 발송 로직을 담당한다. FCM, APNs 등 푸시 서비스 연동 시 이 클래스를 확장
 */
@Slf4j
@Component
public class NotificationHandler {

  /**
   * 알림 이벤트를 처리한다.
   *
   * @param event 알림 이벤트
   */
  public void handle(NotificationEvent event) {
    log.info("Handling notification: type={}, userId={}", event.type(), event.userId());

    switch (event.type()) {
      case TIME_BLOCK_REMINDER -> handleTimeBlockReminder(event);
      case STUDY_COMPLETE -> handleStudyComplete(event);
      case GENERAL -> handleGeneral(event);
    }
  }

  private void handleTimeBlockReminder(NotificationEvent event) {
    log.info(
        "Sending time block reminder to user {}: title={}, body={}",
        event.userId(),
        event.title(),
        event.body());

    // TODO: FCM/APNs를 통한 실제 푸시 알림 발송 구현
    sendPushNotification(event);
  }

  private void handleStudyComplete(NotificationEvent event) {
    log.info(
        "Sending study complete notification to user {}: title={}, body={}",
        event.userId(),
        event.title(),
        event.body());

    // TODO: FCM/APNs를 통한 실제 푸시 알림 발송 구현
    sendPushNotification(event);
  }

  private void handleGeneral(NotificationEvent event) {
    log.info(
        "Sending general notification to user {}: title={}, body={}",
        event.userId(),
        event.title(),
        event.body());

    // TODO: FCM/APNs를 통한 실제 푸시 알림 발송 구현
    sendPushNotification(event);
  }

  /**
   * 푸시 알림을 발송한다.
   *
   * <p>실제 구현 시 사용자 디바이스 토큰을 조회하여 FCM/APNs로 발송
   *
   * @param event 알림 이벤트
   */
  private void sendPushNotification(NotificationEvent event) {
    // TODO: 실제 푸시 알림 발송 로직 구현
    // 1. 사용자 디바이스 토큰 조회
    // 2. FCM/APNs API 호출
    // 3. 발송 결과 로깅

    log.debug(
        "Push notification sent (mock): id={}, userId={}, title={}",
        event.id(),
        event.userId(),
        event.title());
  }
}
