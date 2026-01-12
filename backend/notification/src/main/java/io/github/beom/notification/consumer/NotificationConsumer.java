package io.github.beom.notification.consumer;

import com.rabbitmq.client.Channel;
import io.github.beom.notification.config.RabbitMQConfig;
import io.github.beom.notification.event.NotificationEvent;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

/**
 * 알림 소비자.
 *
 * <p>RabbitMQ에서 알림 이벤트를 수신하여 처리한다. Manual ACK 모드로 메시지 유실 방지
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationConsumer {

  private final NotificationHandler notificationHandler;

  /**
   * 알림 이벤트를 수신하여 처리한다.
   *
   * @param event 알림 이벤트
   * @param channel RabbitMQ 채널
   * @param deliveryTag 메시지 태그
   * @throws IOException 처리 중 오류 발생 시
   */
  @RabbitListener(queues = RabbitMQConfig.NOTIFICATION_QUEUE)
  public void handleNotification(
      NotificationEvent event, Channel channel, @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag)
      throws IOException {

    log.info(
        "Received notification event: id={}, userId={}, type={}",
        event.id(),
        event.userId(),
        event.type());

    try {
      // 알림 처리 (푸시 알림 발송 등)
      notificationHandler.handle(event);

      // 성공 시 ACK
      channel.basicAck(deliveryTag, false);
      log.debug("Notification processed successfully: id={}", event.id());

    } catch (Exception e) {
      log.error("Failed to process notification: id={}, error={}", event.id(), e.getMessage(), e);

      // 실패 시 NACK (DLQ로 이동, 재시도 없음)
      channel.basicNack(deliveryTag, false, false);
    }
  }
}
