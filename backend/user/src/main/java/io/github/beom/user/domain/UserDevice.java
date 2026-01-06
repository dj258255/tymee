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
  private String deviceId;
  private DevicePlatform deviceType;
  private String pushToken;
  private String appVersion;
  private String osVersion;
  private Boolean isActive;
  private LocalDateTime lastUsedAt;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;

  /**
   * 디바이스를 등록한다.
   *
   * @param userId 사용자 ID
   * @param deviceId 디바이스 고유 ID
   * @param deviceType 플랫폼 (IOS, ANDROID)
   * @param pushToken FCM/APNs 토큰
   * @param appVersion 앱 버전
   * @param osVersion OS 버전
   */
  public static UserDevice create(
      Long userId,
      String deviceId,
      DevicePlatform deviceType,
      String pushToken,
      String appVersion,
      String osVersion) {
    return UserDevice.builder()
        .userId(userId)
        .deviceId(deviceId)
        .deviceType(deviceType)
        .pushToken(pushToken)
        .appVersion(appVersion)
        .osVersion(osVersion)
        .isActive(true)
        .lastUsedAt(LocalDateTime.now())
        .createdAt(LocalDateTime.now())
        .updatedAt(LocalDateTime.now())
        .build();
  }

  /** 푸시 토큰을 갱신한다. 앱 재설치 등으로 토큰이 변경될 수 있음. */
  public UserDevice updatePushToken(String newPushToken) {
    return UserDevice.builder()
        .id(this.id)
        .userId(this.userId)
        .deviceId(this.deviceId)
        .deviceType(this.deviceType)
        .pushToken(newPushToken)
        .appVersion(this.appVersion)
        .osVersion(this.osVersion)
        .isActive(this.isActive)
        .lastUsedAt(LocalDateTime.now())
        .createdAt(this.createdAt)
        .updatedAt(LocalDateTime.now())
        .build();
  }
}
