package io.github.beom.notification.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ 설정.
 *
 * <p>Queue, Exchange, Binding 설정 및 DLQ(Dead Letter Queue) 구성
 */
@Configuration
public class RabbitMQConfig {

  public static final String NOTIFICATION_QUEUE = "notification.queue";
  public static final String NOTIFICATION_DLQ = "notification.dlq";
  public static final String NOTIFICATION_EXCHANGE = "notification.exchange";
  public static final String NOTIFICATION_ROUTING_KEY = "notification";
  public static final String NOTIFICATION_DEAD_ROUTING_KEY = "notification.dead";

  /**
   * 알림 큐 생성.
   *
   * <p>메시지 처리 실패 시 DLQ로 라우팅되도록 설정
   */
  @Bean
  public Queue notificationQueue() {
    return QueueBuilder.durable(NOTIFICATION_QUEUE)
        .withArgument("x-dead-letter-exchange", NOTIFICATION_EXCHANGE)
        .withArgument("x-dead-letter-routing-key", NOTIFICATION_DEAD_ROUTING_KEY)
        .build();
  }

  /** DLQ(Dead Letter Queue) 생성. 실패한 메시지를 보관하여 수동 처리 가능 */
  @Bean
  public Queue notificationDLQ() {
    return QueueBuilder.durable(NOTIFICATION_DLQ).build();
  }

  /** Direct Exchange 생성. 라우팅 키 기반으로 메시지 라우팅 */
  @Bean
  public DirectExchange notificationExchange() {
    return new DirectExchange(NOTIFICATION_EXCHANGE);
  }

  /** 알림 큐와 Exchange 바인딩 */
  @Bean
  public Binding notificationBinding(Queue notificationQueue, DirectExchange notificationExchange) {
    return BindingBuilder.bind(notificationQueue)
        .to(notificationExchange)
        .with(NOTIFICATION_ROUTING_KEY);
  }

  /** DLQ와 Exchange 바인딩 */
  @Bean
  public Binding dlqBinding(Queue notificationDLQ, DirectExchange notificationExchange) {
    return BindingBuilder.bind(notificationDLQ)
        .to(notificationExchange)
        .with(NOTIFICATION_DEAD_ROUTING_KEY);
  }

  /** JSON 메시지 컨버터 설정 */
  @Bean
  public MessageConverter jsonMessageConverter() {
    return new Jackson2JsonMessageConverter();
  }

  /** RabbitTemplate 설정 */
  @Bean
  public RabbitTemplate rabbitTemplate(
      ConnectionFactory connectionFactory, MessageConverter jsonMessageConverter) {
    RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
    rabbitTemplate.setMessageConverter(jsonMessageConverter);
    return rabbitTemplate;
  }
}
