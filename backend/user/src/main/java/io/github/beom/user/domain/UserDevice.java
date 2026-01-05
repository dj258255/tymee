package io.github.beom.user.domain;

import io.github.beom.user.domain.vo.DevicePlatform;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

/**
 * 사용자 디바이스 도메인 모델.
 *
 * <p>FCM 푸시 알림 발송을 위한 디바이스 토큰을 관리한다. 한 사용자가 여러 디바이스를 사용할 수 있으므로 1:N 관계.
 */
@Getter
@Builder
public class UserDevice {

  private Long id;
  private Long userId;
  private String fcmToken;
  private DevicePlatform platform;
  private String deviceId;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;

  /**
   * 디바이스를 등록한다.
   *
   * @param userId 사용자 ID
   * @param fcmToken FCM 토큰
   * @param platform 플랫폼 (IOS, ANDROID)
   * @param deviceId 디바이스 고유 ID (UUID 등)
   */
  public static UserDevice create(
      Long userId, String fcmToken, DevicePlatform platform, String deviceId) {
    return UserDevice.builder()
        .userId(userId)
        .fcmToken(fcmToken)
        .platform(platform)
        .deviceId(deviceId)
        .createdAt(LocalDateTime.now())
        .updatedAt(LocalDateTime.now())
        .build();
  }

  /** FCM 토큰을 갱신한다. 앱 재설치 등으로 토큰이 변경될 수 있음. */
  public UserDevice updateFcmToken(String newFcmToken) {
    return UserDevice.builder()
        .id(this.id)
        .userId(this.userId)
        .fcmToken(newFcmToken)
        .platform(this.platform)
        .deviceId(this.deviceId)
        .createdAt(this.createdAt)
        .updatedAt(LocalDateTime.now())
        .build();
  }
}
