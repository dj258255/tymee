package io.github.beom.notification.publisher;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

import io.github.beom.notification.config.RabbitMQConfig;
import io.github.beom.notification.event.NotificationEvent;
import io.github.beom.notification.event.NotificationType;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationPublisher 테스트")
class NotificationPublisherTest {

  @Mock private RabbitTemplate rabbitTemplate;

  @InjectMocks private NotificationPublisher notificationPublisher;

  @Test
  @DisplayName("성공: 알림 이벤트 발행")
  void publishNotificationSuccess() {
    // given
    NotificationEvent event =
        NotificationEvent.create(
            1L, NotificationType.GENERAL, "테스트 알림", "테스트 본문", Map.of("key", "value"));

    // when
    notificationPublisher.publish(event);

    // then
    verify(rabbitTemplate)
        .convertAndSend(
            eq(RabbitMQConfig.NOTIFICATION_EXCHANGE),
            eq(RabbitMQConfig.NOTIFICATION_ROUTING_KEY),
            eq(event));
  }

  @Test
  @DisplayName("성공: 타임블록 알림 발행")
  void publishTimeBlockReminderSuccess() {
    // given
    Long userId = 1L;
    String subjectName = "수학";
    String startTime = "09:00";

    // when
    notificationPublisher.publishTimeBlockReminder(userId, subjectName, startTime);

    // then
    verify(rabbitTemplate)
        .convertAndSend(
            eq(RabbitMQConfig.NOTIFICATION_EXCHANGE),
            eq(RabbitMQConfig.NOTIFICATION_ROUTING_KEY),
            any(NotificationEvent.class));
  }

  @Test
  @DisplayName("성공: 학습 완료 알림 발행")
  void publishStudyCompleteSuccess() {
    // given
    Long userId = 1L;
    String subjectName = "영어";
    int durationMinutes = 60;

    // when
    notificationPublisher.publishStudyComplete(userId, subjectName, durationMinutes);

    // then
    verify(rabbitTemplate)
        .convertAndSend(
            eq(RabbitMQConfig.NOTIFICATION_EXCHANGE),
            eq(RabbitMQConfig.NOTIFICATION_ROUTING_KEY),
            any(NotificationEvent.class));
  }
}
