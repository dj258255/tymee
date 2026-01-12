package io.github.beom.notification.publisher;

import io.github.beom.notification.config.RabbitMQConfig;
import io.github.beom.notification.event.NotificationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

/**
 * 알림 발행자.
 *
 * <p>RabbitMQ를 통해 알림 이벤트를 발행한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationPublisher {

  private final RabbitTemplate rabbitTemplate;

  /**
   * 알림 이벤트를 발행한다.
   *
   * @param event 알림 이벤트
   */
  public void publish(NotificationEvent event) {
    log.info(
        "Publishing notification event: id={}, userId={}, type={}",
        event.id(),
        event.userId(),
        event.type());

    rabbitTemplate.convertAndSend(
        RabbitMQConfig.NOTIFICATION_EXCHANGE, RabbitMQConfig.NOTIFICATION_ROUTING_KEY, event);

    log.debug("Notification event published successfully: id={}", event.id());
  }

  /**
   * 타임블록 알림을 발행한다.
   *
   * @param userId 사용자 ID
   * @param subjectName 과목명
   * @param startTime 시작 시간
   */
  public void publishTimeBlockReminder(Long userId, String subjectName, String startTime) {
    NotificationEvent event = NotificationEvent.timeBlockReminder(userId, subjectName, startTime);
    publish(event);
  }

  /**
   * 학습 완료 알림을 발행한다.
   *
   * @param userId 사용자 ID
   * @param subjectName 과목명
   * @param durationMinutes 학습 시간(분)
   */
  public void publishStudyComplete(Long userId, String subjectName, int durationMinutes) {
    NotificationEvent event = NotificationEvent.studyComplete(userId, subjectName, durationMinutes);
    publish(event);
  }
}
