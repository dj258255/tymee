package io.github.beom.user.domain.vo;

/**
 * 디바이스 플랫폼.
 *
 * <p>FCM 푸시 알림 발송 시 플랫폼별 처리가 필요할 수 있어 구분한다.
 */
public enum DevicePlatform {
  IOS,
  ANDROID
}
