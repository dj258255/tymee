package io.github.beom.notification.service;

import com.google.firebase.messaging.AndroidConfig;
import com.google.firebase.messaging.AndroidNotification;
import com.google.firebase.messaging.ApnsConfig;
import com.google.firebase.messaging.Aps;
import com.google.firebase.messaging.BatchResponse;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.MessagingErrorCode;
import com.google.firebase.messaging.MulticastMessage;
import com.google.firebase.messaging.Notification;
import com.google.firebase.messaging.SendResponse;
import io.github.beom.notification.dto.FcmMessage;
import io.github.beom.notification.dto.FcmResult;
import io.github.beom.user.domain.UserDevice;
import io.github.beom.user.repository.UserDeviceRepository;
import io.github.beom.user.service.UserDeviceService;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * FCM 푸시 알림 발송 서비스.
 *
 * <p>Firebase Cloud Messaging을 통해 모바일 기기에 푸시 알림을 발송한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FcmService {

  private final FirebaseMessaging firebaseMessaging;
  private final UserDeviceService userDeviceService;
  private final UserDeviceRepository userDeviceRepository;

  /**
   * 특정 사용자의 모든 활성 디바이스에 푸시 알림을 발송한다.
   *
   * @param userId 대상 사용자 ID
   * @param fcmMessage 발송할 메시지
   * @return 발송 결과
   */
  public FcmResult sendToUser(Long userId, FcmMessage fcmMessage) {
    List<UserDevice> devices = userDeviceService.getActiveUserDevices(userId);

    if (devices.isEmpty()) {
      log.debug("No active devices found for user: {}", userId);
      return FcmResult.builder()
          .totalCount(0)
          .successCount(0)
          .failureCount(0)
          .failedTokens(List.of())
          .build();
    }

    List<String> tokens = devices.stream().map(UserDevice::getPushToken).toList();

    return sendToTokens(tokens, fcmMessage);
  }

  /**
   * 여러 사용자의 모든 활성 디바이스에 푸시 알림을 발송한다.
   *
   * @param userIds 대상 사용자 ID 목록
   * @param fcmMessage 발송할 메시지
   * @return 발송 결과
   */
  public FcmResult sendToUsers(List<Long> userIds, FcmMessage fcmMessage) {
    List<String> allTokens = new ArrayList<>();

    for (Long userId : userIds) {
      List<UserDevice> devices = userDeviceService.getActiveUserDevices(userId);
      devices.stream().map(UserDevice::getPushToken).forEach(allTokens::add);
    }

    if (allTokens.isEmpty()) {
      log.debug("No active devices found for users: {}", userIds);
      return FcmResult.builder()
          .totalCount(0)
          .successCount(0)
          .failureCount(0)
          .failedTokens(List.of())
          .build();
    }

    return sendToTokens(allTokens, fcmMessage);
  }

  /**
   * 토큰 목록에 푸시 알림을 발송한다.
   *
   * @param tokens FCM 토큰 목록
   * @param fcmMessage 발송할 메시지
   * @return 발송 결과
   */
  public FcmResult sendToTokens(List<String> tokens, FcmMessage fcmMessage) {
    if (tokens.isEmpty()) {
      return FcmResult.builder()
          .totalCount(0)
          .successCount(0)
          .failureCount(0)
          .failedTokens(List.of())
          .build();
    }

    // 단일 토큰인 경우
    if (tokens.size() == 1) {
      return sendSingle(tokens.get(0), fcmMessage);
    }

    // 다중 토큰인 경우 (최대 500개씩 배치 발송)
    return sendMulticast(tokens, fcmMessage);
  }

  /**
   * 단일 토큰에 푸시 알림을 발송한다.
   *
   * @param token FCM 토큰
   * @param fcmMessage 발송할 메시지
   * @return 발송 결과
   */
  private FcmResult sendSingle(String token, FcmMessage fcmMessage) {
    Message message = buildMessage(token, fcmMessage);

    try {
      String messageId = firebaseMessaging.send(message);
      log.debug("FCM message sent successfully. MessageId: {}", messageId);
      return FcmResult.single(true, token);
    } catch (FirebaseMessagingException e) {
      log.error("Failed to send FCM message to token: {}", token, e);
      handleMessagingError(token, e);
      return FcmResult.single(false, token);
    }
  }

  /**
   * 여러 토큰에 멀티캐스트로 푸시 알림을 발송한다.
   *
   * <p>FCM은 한 번에 최대 500개 토큰까지 발송 가능
   *
   * @param tokens FCM 토큰 목록
   * @param fcmMessage 발송할 메시지
   * @return 발송 결과
   */
  private FcmResult sendMulticast(List<String> tokens, FcmMessage fcmMessage) {
    int totalCount = tokens.size();
    int successCount = 0;
    List<String> failedTokens = new ArrayList<>();

    // 500개씩 배치 처리
    int batchSize = 500;
    for (int i = 0; i < tokens.size(); i += batchSize) {
      List<String> batchTokens = tokens.subList(i, Math.min(i + batchSize, tokens.size()));
      FcmResult batchResult = sendBatch(batchTokens, fcmMessage);
      successCount += batchResult.getSuccessCount();
      failedTokens.addAll(batchResult.getFailedTokens());
    }

    return FcmResult.builder()
        .totalCount(totalCount)
        .successCount(successCount)
        .failureCount(totalCount - successCount)
        .failedTokens(failedTokens)
        .build();
  }

  /**
   * 배치(최대 500개)로 멀티캐스트 발송한다.
   *
   * @param tokens FCM 토큰 목록 (최대 500개)
   * @param fcmMessage 발송할 메시지
   * @return 발송 결과
   */
  private FcmResult sendBatch(List<String> tokens, FcmMessage fcmMessage) {
    MulticastMessage message = buildMulticastMessage(tokens, fcmMessage);

    try {
      BatchResponse response = firebaseMessaging.sendEachForMulticast(message);

      List<String> failedTokens = new ArrayList<>();
      List<SendResponse> responses = response.getResponses();

      for (int i = 0; i < responses.size(); i++) {
        SendResponse sendResponse = responses.get(i);
        if (!sendResponse.isSuccessful()) {
          String failedToken = tokens.get(i);
          failedTokens.add(failedToken);

          FirebaseMessagingException exception = sendResponse.getException();
          if (exception != null) {
            handleMessagingError(failedToken, exception);
          }
        }
      }

      log.debug(
          "FCM multicast sent. Success: {}, Failure: {}",
          response.getSuccessCount(),
          response.getFailureCount());

      return FcmResult.builder()
          .totalCount(tokens.size())
          .successCount(response.getSuccessCount())
          .failureCount(response.getFailureCount())
          .failedTokens(failedTokens)
          .build();
    } catch (FirebaseMessagingException e) {
      log.error("Failed to send FCM multicast message", e);
      return FcmResult.builder()
          .totalCount(tokens.size())
          .successCount(0)
          .failureCount(tokens.size())
          .failedTokens(tokens)
          .build();
    }
  }

  /**
   * FCM Message 객체를 생성한다.
   *
   * @param token 대상 토큰
   * @param fcmMessage 메시지 내용
   * @return FCM Message
   */
  private Message buildMessage(String token, FcmMessage fcmMessage) {
    Message.Builder builder =
        Message.builder()
            .setToken(token)
            .setNotification(buildNotification(fcmMessage))
            .setAndroidConfig(buildAndroidConfig(fcmMessage))
            .setApnsConfig(buildApnsConfig(fcmMessage));

    if (fcmMessage.getData() != null && !fcmMessage.getData().isEmpty()) {
      builder.putAllData(fcmMessage.getData());
    }

    return builder.build();
  }

  /**
   * FCM MulticastMessage 객체를 생성한다.
   *
   * @param tokens 대상 토큰 목록
   * @param fcmMessage 메시지 내용
   * @return FCM MulticastMessage
   */
  private MulticastMessage buildMulticastMessage(List<String> tokens, FcmMessage fcmMessage) {
    MulticastMessage.Builder builder =
        MulticastMessage.builder()
            .addAllTokens(tokens)
            .setNotification(buildNotification(fcmMessage))
            .setAndroidConfig(buildAndroidConfig(fcmMessage))
            .setApnsConfig(buildApnsConfig(fcmMessage));

    if (fcmMessage.getData() != null && !fcmMessage.getData().isEmpty()) {
      builder.putAllData(fcmMessage.getData());
    }

    return builder.build();
  }

  /**
   * 공통 Notification 객체를 생성한다.
   *
   * @param fcmMessage 메시지 내용
   * @return Notification
   */
  private Notification buildNotification(FcmMessage fcmMessage) {
    Notification.Builder builder =
        Notification.builder().setTitle(fcmMessage.getTitle()).setBody(fcmMessage.getBody());

    if (fcmMessage.getImageUrl() != null) {
      builder.setImage(fcmMessage.getImageUrl());
    }

    return builder.build();
  }

  /**
   * Android 플랫폼 설정을 생성한다.
   *
   * @param fcmMessage 메시지 내용
   * @return AndroidConfig
   */
  private AndroidConfig buildAndroidConfig(FcmMessage fcmMessage) {
    AndroidNotification.Builder notificationBuilder =
        AndroidNotification.builder()
            .setSound(fcmMessage.getSound() != null ? fcmMessage.getSound() : "default")
            .setDefaultVibrateTimings(true)
            .setDefaultLightSettings(true);

    return AndroidConfig.builder()
        .setNotification(notificationBuilder.build())
        .setPriority(AndroidConfig.Priority.HIGH)
        .build();
  }

  /**
   * iOS(APNs) 플랫폼 설정을 생성한다.
   *
   * @param fcmMessage 메시지 내용
   * @return ApnsConfig
   */
  private ApnsConfig buildApnsConfig(FcmMessage fcmMessage) {
    Aps.Builder apsBuilder =
        Aps.builder().setSound(fcmMessage.getSound() != null ? fcmMessage.getSound() : "default");

    if (fcmMessage.getBadge() != null) {
      apsBuilder.setBadge(fcmMessage.getBadge());
    }

    return ApnsConfig.builder().setAps(apsBuilder.build()).build();
  }

  /**
   * FCM 발송 오류를 처리한다.
   *
   * <p>UNREGISTERED, INVALID_ARGUMENT 등 토큰 문제인 경우 디바이스를 비활성화한다.
   *
   * @param token 실패한 토큰
   * @param exception FCM 예외
   */
  private void handleMessagingError(String token, FirebaseMessagingException exception) {
    MessagingErrorCode errorCode = exception.getMessagingErrorCode();

    if (errorCode == MessagingErrorCode.UNREGISTERED
        || errorCode == MessagingErrorCode.INVALID_ARGUMENT) {
      log.info("Deactivating invalid FCM token: {}. Error: {}", token, errorCode);
      deactivateDeviceByToken(token);
    }
  }

  /**
   * 토큰으로 디바이스를 찾아 비활성화한다.
   *
   * @param token FCM 토큰
   */
  private void deactivateDeviceByToken(String token) {
    userDeviceRepository.deactivateByPushToken(token);
  }
}
