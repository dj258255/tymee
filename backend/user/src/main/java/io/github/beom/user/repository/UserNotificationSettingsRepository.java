package io.github.beom.user.repository;

import io.github.beom.user.domain.UserNotificationSettings;
import io.github.beom.user.entity.UserNotificationSettingsEntity;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

/** 사용자 알림 설정 레포지토리. */
@Repository
@RequiredArgsConstructor
public class UserNotificationSettingsRepository {

  private final UserNotificationSettingsJpaRepository jpaRepository;

  public Optional<UserNotificationSettings> findByUserId(Long userId) {
    return jpaRepository.findById(userId).map(UserNotificationSettingsEntity::toDomain);
  }

  public boolean existsByUserId(Long userId) {
    return jpaRepository.existsById(userId);
  }

  public UserNotificationSettings save(UserNotificationSettings settings) {
    UserNotificationSettingsEntity entity = UserNotificationSettingsEntity.from(settings);
    UserNotificationSettingsEntity savedEntity = jpaRepository.save(entity);
    return savedEntity.toDomain();
  }

  public void deleteByUserId(Long userId) {
    jpaRepository.deleteById(userId);
  }

  /**
   * 사용자 알림 설정 조회, 없으면 기본값으로 생성.
   *
   * @param userId 사용자 ID
   * @return 사용자 알림 설정
   */
  public UserNotificationSettings findOrCreateByUserId(Long userId) {
    return findByUserId(userId)
        .orElseGet(() -> save(UserNotificationSettings.createDefault(userId)));
  }
}
