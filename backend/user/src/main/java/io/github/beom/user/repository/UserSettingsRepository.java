package io.github.beom.user.repository;

import io.github.beom.user.domain.UserSettings;
import io.github.beom.user.entity.UserSettingsEntity;
import io.github.beom.user.mapper.UserSettingsMapper;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

/** 사용자 설정 레포지토리. */
@Repository
@RequiredArgsConstructor
public class UserSettingsRepository {

  private final UserSettingsJpaRepository userSettingsJpaRepository;
  private final UserSettingsMapper userSettingsMapper;

  public Optional<UserSettings> findByUserId(Long userId) {
    return userSettingsJpaRepository.findById(userId).map(userSettingsMapper::toDomain);
  }

  public boolean existsByUserId(Long userId) {
    return userSettingsJpaRepository.existsById(userId);
  }

  public UserSettings save(UserSettings settings) {
    UserSettingsEntity entity = userSettingsMapper.toEntity(settings);
    UserSettingsEntity savedEntity = userSettingsJpaRepository.save(entity);
    return userSettingsMapper.toDomain(savedEntity);
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
