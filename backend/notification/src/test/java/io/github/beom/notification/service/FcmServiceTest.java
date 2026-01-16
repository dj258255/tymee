package io.github.beom.notification.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import com.google.firebase.messaging.BatchResponse;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.MessagingErrorCode;
import com.google.firebase.messaging.MulticastMessage;
import com.google.firebase.messaging.SendResponse;
import io.github.beom.notification.dto.FcmMessage;
import io.github.beom.notification.dto.FcmResult;
import io.github.beom.user.domain.UserDevice;
import io.github.beom.user.domain.vo.DevicePlatform;
import io.github.beom.user.repository.UserDeviceRepository;
import io.github.beom.user.service.UserDeviceService;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class FcmServiceTest {

  @Mock private FirebaseMessaging firebaseMessaging;
  @Mock private UserDeviceService userDeviceService;
  @Mock private UserDeviceRepository userDeviceRepository;

  @InjectMocks private FcmService fcmService;

  private FcmMessage testMessage;
  private UserDevice testDevice;

  @BeforeEach
  void setUp() {
    testMessage =
        FcmMessage.builder()
            .title("테스트 알림")
            .body("테스트 내용입니다.")
            .data(Map.of("key", "value"))
            .build();

    testDevice =
        UserDevice.builder()
            .id(1L)
            .userId(100L)
            .deviceId("device-123")
            .deviceType(DevicePlatform.IOS)
            .pushToken("fcm-token-123")
            .isActive(true)
            .build();
  }

  @Nested
  @DisplayName("sendToUser")
  class SendToUserTest {

    @Test
    @DisplayName("활성 디바이스가 없으면 빈 결과를 반환한다")
    void returnsEmptyResultWhenNoActiveDevices() {
      // given
      given(userDeviceService.getActiveUserDevices(100L)).willReturn(List.of());

      // when
      FcmResult result = fcmService.sendToUser(100L, testMessage);

      // then
      assertThat(result.getTotalCount()).isZero();
      assertThat(result.getSuccessCount()).isZero();
      assertThat(result.getFailureCount()).isZero();
    }

    @Test
    @DisplayName("단일 디바이스에 푸시 알림을 발송한다")
    void sendsPushToSingleDevice() throws FirebaseMessagingException {
      // given
      given(userDeviceService.getActiveUserDevices(100L)).willReturn(List.of(testDevice));
      given(firebaseMessaging.send(any(Message.class))).willReturn("message-id-123");

      // when
      FcmResult result = fcmService.sendToUser(100L, testMessage);

      // then
      assertThat(result.getTotalCount()).isEqualTo(1);
      assertThat(result.getSuccessCount()).isEqualTo(1);
      assertThat(result.getFailureCount()).isZero();
      verify(firebaseMessaging, times(1)).send(any(Message.class));
    }

    @Test
    @DisplayName("발송 실패 시 실패 결과를 반환한다")
    void returnsFailureResultOnError() throws FirebaseMessagingException {
      // given
      given(userDeviceService.getActiveUserDevices(100L)).willReturn(List.of(testDevice));

      FirebaseMessagingException mockException = mock(FirebaseMessagingException.class);
      given(mockException.getMessagingErrorCode()).willReturn(MessagingErrorCode.INTERNAL);
      given(firebaseMessaging.send(any(Message.class))).willThrow(mockException);

      // when
      FcmResult result = fcmService.sendToUser(100L, testMessage);

      // then
      assertThat(result.getTotalCount()).isEqualTo(1);
      assertThat(result.getSuccessCount()).isZero();
      assertThat(result.getFailureCount()).isEqualTo(1);
      assertThat(result.getFailedTokens()).contains("fcm-token-123");
    }

    @Test
    @DisplayName("UNREGISTERED 오류 시 토큰을 비활성화한다")
    void deactivatesTokenOnUnregisteredError() throws FirebaseMessagingException {
      // given
      given(userDeviceService.getActiveUserDevices(100L)).willReturn(List.of(testDevice));

      FirebaseMessagingException mockException = mock(FirebaseMessagingException.class);
      given(mockException.getMessagingErrorCode()).willReturn(MessagingErrorCode.UNREGISTERED);
      given(firebaseMessaging.send(any(Message.class))).willThrow(mockException);

      // when
      fcmService.sendToUser(100L, testMessage);

      // then
      verify(userDeviceRepository).deactivateByPushToken("fcm-token-123");
    }
  }

  @Nested
  @DisplayName("sendToUsers")
  class SendToUsersTest {

    @Test
    @DisplayName("여러 사용자의 디바이스에 푸시 알림을 발송한다")
    void sendsPushToMultipleUsers() throws FirebaseMessagingException {
      // given
      UserDevice device1 =
          UserDevice.builder()
              .userId(100L)
              .deviceId("device-1")
              .pushToken("token-1")
              .isActive(true)
              .build();
      UserDevice device2 =
          UserDevice.builder()
              .userId(200L)
              .deviceId("device-2")
              .pushToken("token-2")
              .isActive(true)
              .build();

      given(userDeviceService.getActiveUserDevices(100L)).willReturn(List.of(device1));
      given(userDeviceService.getActiveUserDevices(200L)).willReturn(List.of(device2));

      BatchResponse batchResponse = mock(BatchResponse.class);
      SendResponse successResponse = mock(SendResponse.class);
      given(successResponse.isSuccessful()).willReturn(true);
      given(batchResponse.getResponses()).willReturn(List.of(successResponse, successResponse));
      given(batchResponse.getSuccessCount()).willReturn(2);
      given(batchResponse.getFailureCount()).willReturn(0);
      given(firebaseMessaging.sendEachForMulticast(any(MulticastMessage.class)))
          .willReturn(batchResponse);

      // when
      FcmResult result = fcmService.sendToUsers(List.of(100L, 200L), testMessage);

      // then
      assertThat(result.getTotalCount()).isEqualTo(2);
      assertThat(result.getSuccessCount()).isEqualTo(2);
      assertThat(result.getFailureCount()).isZero();
    }

    @Test
    @DisplayName("활성 디바이스가 없으면 빈 결과를 반환한다")
    void returnsEmptyResultWhenNoActiveDevices() {
      // given
      given(userDeviceService.getActiveUserDevices(100L)).willReturn(List.of());
      given(userDeviceService.getActiveUserDevices(200L)).willReturn(List.of());

      // when
      FcmResult result = fcmService.sendToUsers(List.of(100L, 200L), testMessage);

      // then
      assertThat(result.getTotalCount()).isZero();
    }
  }

  @Nested
  @DisplayName("sendToTokens")
  class SendToTokensTest {

    @Test
    @DisplayName("빈 토큰 목록이면 빈 결과를 반환한다")
    void returnsEmptyResultForEmptyTokens() {
      // when
      FcmResult result = fcmService.sendToTokens(List.of(), testMessage);

      // then
      assertThat(result.getTotalCount()).isZero();
    }

    @Test
    @DisplayName("단일 토큰은 단일 발송 API를 사용한다")
    void usesSingleSendApiForOneToken() throws FirebaseMessagingException {
      // given
      given(firebaseMessaging.send(any(Message.class))).willReturn("message-id");

      // when
      FcmResult result = fcmService.sendToTokens(List.of("token-1"), testMessage);

      // then
      assertThat(result.getSuccessCount()).isEqualTo(1);
      verify(firebaseMessaging, times(1)).send(any(Message.class));
      verify(firebaseMessaging, never()).sendEachForMulticast(any(MulticastMessage.class));
    }

    @Test
    @DisplayName("여러 토큰은 멀티캐스트 API를 사용한다")
    void usesMulticastApiForMultipleTokens() throws FirebaseMessagingException {
      // given
      BatchResponse batchResponse = mock(BatchResponse.class);
      SendResponse successResponse = mock(SendResponse.class);
      given(successResponse.isSuccessful()).willReturn(true);
      given(batchResponse.getResponses()).willReturn(List.of(successResponse, successResponse));
      given(batchResponse.getSuccessCount()).willReturn(2);
      given(batchResponse.getFailureCount()).willReturn(0);
      given(firebaseMessaging.sendEachForMulticast(any(MulticastMessage.class)))
          .willReturn(batchResponse);

      // when
      FcmResult result = fcmService.sendToTokens(List.of("token-1", "token-2"), testMessage);

      // then
      assertThat(result.getSuccessCount()).isEqualTo(2);
      verify(firebaseMessaging, never()).send(any(Message.class));
      verify(firebaseMessaging, times(1)).sendEachForMulticast(any(MulticastMessage.class));
    }
  }

  @Nested
  @DisplayName("FcmMessage")
  class FcmMessageTest {

    @Test
    @DisplayName("이미지 URL과 뱃지를 포함한 메시지를 생성한다")
    void createsMessageWithImageAndBadge() throws FirebaseMessagingException {
      // given
      FcmMessage messageWithExtras =
          FcmMessage.builder()
              .title("알림")
              .body("내용")
              .imageUrl("https://example.com/image.png")
              .badge(5)
              .sound("custom_sound")
              .build();

      given(userDeviceService.getActiveUserDevices(100L)).willReturn(List.of(testDevice));
      given(firebaseMessaging.send(any(Message.class))).willReturn("message-id");

      // when
      FcmResult result = fcmService.sendToUser(100L, messageWithExtras);

      // then
      assertThat(result.getSuccessCount()).isEqualTo(1);
      verify(firebaseMessaging).send(any(Message.class));
    }
  }
}
