package io.github.beom.user.service;

import io.github.beom.user.domain.UserDevice;
import io.github.beom.user.domain.vo.DevicePlatform;
import io.github.beom.user.repository.UserDeviceRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 사용자 디바이스 관련 비즈니스 로직을 처리하는 서비스.
 *
 * <p>FCM 푸시 알림 발송을 위한 디바이스 토큰을 관리한다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserDeviceService {

  private final UserDeviceRepository userDeviceRepository;

  /**
   * 디바이스를 등록하거나 FCM 토큰을 갱신한다.
   *
   * <p>같은 사용자의 같은 디바이스가 이미 등록되어 있으면 FCM 토큰만 업데이트한다. 앱 재설치 등으로 FCM 토큰이 변경될 수 있기 때문.
   */
  @Transactional
  public void registerDevice(
      Long userId, String fcmToken, DevicePlatform platform, String deviceId) {
    UserDevice userDevice = UserDevice.create(userId, fcmToken, platform, deviceId);
    userDeviceRepository.upsert(userDevice);
  }

  /** 디바이스를 삭제한다. 로그아웃 시 호출하여 해당 기기로 푸시 알림이 가지 않도록 한다. */
  @Transactional
  public void unregisterDevice(Long userId, String deviceId) {
    userDeviceRepository.deleteByUserIdAndDeviceId(userId, deviceId);
  }

  /** 사용자의 모든 디바이스를 삭제한다. 회원 탈퇴 시 사용. */
  @Transactional
  public void unregisterAllDevices(Long userId) {
    userDeviceRepository.deleteAllByUserId(userId);
  }

  /** 사용자의 모든 디바이스를 조회한다. 푸시 알림 발송 서비스에서 사용. */
  public List<UserDevice> getUserDevices(Long userId) {
    return userDeviceRepository.findAllByUserId(userId);
  }
}
