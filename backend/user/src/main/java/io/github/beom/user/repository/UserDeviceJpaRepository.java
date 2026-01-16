package io.github.beom.user.repository;

import io.github.beom.user.entity.UserDeviceEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

/** 사용자 디바이스 JPA 레포지토리. */
public interface UserDeviceJpaRepository extends JpaRepository<UserDeviceEntity, Long> {

  /** 사용자 ID와 디바이스 ID로 디바이스를 조회한다. */
  Optional<UserDeviceEntity> findByUserIdAndDeviceId(Long userId, String deviceId);

  /** 사용자의 모든 디바이스를 조회한다. 푸시 알림 발송 시 사용. */
  List<UserDeviceEntity> findAllByUserId(Long userId);

  /** 사용자의 활성화된 디바이스만 조회한다. 실제 푸시 알림 발송 시 사용. */
  List<UserDeviceEntity> findAllByUserIdAndIsActiveTrue(Long userId);

  /** 사용자 ID와 디바이스 ID로 디바이스를 삭제한다. */
  @Modifying
  void deleteByUserIdAndDeviceId(Long userId, String deviceId);

  /** 사용자의 모든 디바이스를 삭제한다. 회원 탈퇴 시 사용. */
  @Modifying
  void deleteAllByUserId(Long userId);

  /** 푸시 토큰으로 디바이스를 조회한다. 토큰 만료 시 비활성화를 위해 사용. */
  Optional<UserDeviceEntity> findByPushToken(String pushToken);
}
