package io.github.beom.user.service;

import io.github.beom.user.domain.UserSettings;
import io.github.beom.user.dto.UserSettingsUpdateRequest;
import io.github.beom.user.mapper.UserSettingsMapper;
import io.github.beom.user.repository.UserSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 사용자 설정 서비스. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserSettingsService {

  private final UserSettingsRepository userSettingsRepository;
  private final UserSettingsMapper userSettingsMapper;

  /**
   * 사용자 설정 조회. 설정이 없으면 기본값으로 자동 생성.
   *
   * @param userId 사용자 ID
   * @return 사용자 설정
   */
  @Transactional
  public UserSettings getSettings(Long userId) {
    return userSettingsRepository.findOrCreateByUserId(userId);
  }

  /**
   * 사용자 설정 부분 업데이트.
   *
   * @param userId 사용자 ID
   * @param request 업데이트 요청 (null인 필드는 무시)
   * @return 업데이트된 설정
   */
  @Transactional
  public UserSettings updateSettings(Long userId, UserSettingsUpdateRequest request) {
    UserSettings settings = userSettingsRepository.findOrCreateByUserId(userId);
    userSettingsMapper.updateFromRequest(request, settings);
    return userSettingsRepository.save(settings);
  }

  /**
   * 신규 사용자의 기본 설정 생성.
   *
   * @param userId 사용자 ID
   * @return 생성된 기본 설정
   */
  @Transactional
  public UserSettings createDefaultSettings(Long userId) {
    return userSettingsRepository.findOrCreateByUserId(userId);
  }
}
