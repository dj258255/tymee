package io.github.beom.user.repository;

import io.github.beom.user.domain.UserDevice;
import io.github.beom.user.entity.UserDeviceEntity;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

/**
 * 사용자 디바이스 레포지토리.
 *
 * <p>도메인 모델과 JPA 엔티티 간 변환을 담당한다.
 */
@Repository
@RequiredArgsConstructor
public class UserDeviceRepository {

  private final UserDeviceJpaRepository jpaRepository;

  public UserDevice save(UserDevice userDevice) {
    UserDeviceEntity entity = UserDeviceEntity.from(userDevice);
    return jpaRepository.save(entity).toDomain();
  }

  public Optional<UserDevice> findByUserIdAndDeviceId(Long userId, String deviceId) {
    return jpaRepository.findByUserIdAndDeviceId(userId, deviceId).map(UserDeviceEntity::toDomain);
  }

  public List<UserDevice> findAllByUserId(Long userId) {
    return jpaRepository.findAllByUserId(userId).stream().map(UserDeviceEntity::toDomain).toList();
  }

  public void deleteByUserIdAndDeviceId(Long userId, String deviceId) {
    jpaRepository.deleteByUserIdAndDeviceId(userId, deviceId);
  }

  public void deleteAllByUserId(Long userId) {
    jpaRepository.deleteAllByUserId(userId);
  }

  /** 푸시 토큰을 업데이트한다. 기존 디바이스가 있으면 토큰만 갱신. */
  public UserDevice upsert(UserDevice userDevice) {
    Optional<UserDeviceEntity> existing =
        jpaRepository.findByUserIdAndDeviceId(userDevice.getUserId(), userDevice.getDeviceId());

    if (existing.isPresent()) {
      UserDeviceEntity entity = existing.get();
      entity.updatePushToken(userDevice.getPushToken());
      return jpaRepository.save(entity).toDomain();
    }

    return save(userDevice);
  }
}
