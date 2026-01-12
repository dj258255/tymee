package io.github.beom.user.repository;

import io.github.beom.user.domain.UserSettings;
import io.github.beom.user.entity.UserSettingsEntity;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

/** 사용자 설정 레포지토리 (알림 설정 제외). */
@Repository
@RequiredArgsConstructor
public class UserSettingsRepository {

  private final UserSettingsJpaRepository userSettingsJpaRepository;

  public Optional<UserSettings> findByUserId(Long userId) {
    return userSettingsJpaRepository.findById(userId).map(UserSettingsEntity::toDomain);
  }

  public boolean existsByUserId(Long userId) {
    return userSettingsJpaRepository.existsById(userId);
  }

  public UserSettings save(UserSettings settings) {
    UserSettingsEntity entity = UserSettingsEntity.from(settings);
    UserSettingsEntity savedEntity = userSettingsJpaRepository.save(entity);
    return savedEntity.toDomain();
  }

  public void deleteByUserId(Long userId) {
    userSettingsJpaRepository.deleteById(userId);
  }

  /**
   * 사용자 설정 조회, 없으면 기본값으로 생성.
   *
   * @param userId 사용자 ID
   * @return 사용자 설정
   */
  public UserSettings findOrCreateByUserId(Long userId) {
    return findByUserId(userId).orElseGet(() -> save(UserSettings.createDefault(userId)));
  }
}
