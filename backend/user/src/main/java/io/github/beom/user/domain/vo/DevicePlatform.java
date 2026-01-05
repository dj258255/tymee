package io.github.beom.user.domain.vo;

import io.github.beom.core.persistence.converter.CodedEnum;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 디바이스 플랫폼.
 *
 * <p>FCM 푸시 알림 발송 시 플랫폼별 처리가 필요할 수 있어 구분한다.
 */
@Getter
@RequiredArgsConstructor
public enum DevicePlatform implements CodedEnum {
  IOS("ios"),
  ANDROID("android");

  private final String code;

  public static DevicePlatform fromCode(String code) {
    for (DevicePlatform platform : values()) {
      if (platform.code.equals(code)) {
        return platform;
      }
    }
    throw new IllegalArgumentException("Unknown device platform: " + code);
  }
}
