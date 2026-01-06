package io.github.beom.user.service;

import io.github.beom.core.exception.BusinessException;
import io.github.beom.core.exception.EntityNotFoundException;
import io.github.beom.core.exception.ErrorCode;
import io.github.beom.user.domain.User;
import io.github.beom.user.domain.vo.Email;
import io.github.beom.user.domain.vo.Nickname;
import io.github.beom.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 사용자 비즈니스 로직 서비스. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

  private final UserRepository userRepository;

  /** ID로 활성 사용자 조회. 탈퇴한 사용자는 조회되지 않는다. */
  public User getById(Long id) {
    return userRepository
        .findActiveById(id)
        .orElseThrow(
            () -> new EntityNotFoundException(ErrorCode.USER_NOT_FOUND, "사용자를 찾을 수 없습니다: " + id));
  }

  /** 이메일로 활성 사용자 조회. */
  public User getByEmail(String email) {
    return userRepository
        .findActiveByEmail(email)
        .orElseThrow(
            () ->
                new EntityNotFoundException(ErrorCode.USER_NOT_FOUND, "사용자를 찾을 수 없습니다: " + email));
  }

  /** 이메일 존재 여부 확인. */
  public boolean existsByEmail(String email) {
    return userRepository.existsByEmail(email);
  }

  /** 닉네임 중복 확인. true면 이미 사용 중. */
  public boolean existsByNickname(String nickname) {
    return userRepository.existsByNickname(nickname);
  }

  /** 소셜 로그인 신규 사용자 생성. */
  @Transactional
  public User createOAuthUser(String email, String nickname) {
    validateDuplicateEmail(email);
    validateDuplicateNickname(nickname);

    User user = User.createOAuthUser(new Email(email), new Nickname(nickname));
    return userRepository.save(user);
  }

  /** 프로필 수정. 닉네임 변경 시 중복 검증한다. */
  @Transactional
  public User updateProfile(Long userId, String nickname, String bio) {
    User user = getById(userId);

    if (!user.getNickname().value().equals(nickname)) {
      validateDuplicateNickname(nickname);
    }

    user.updateProfile(new Nickname(nickname), bio);
    return userRepository.save(user);
  }

  /** 프로필 이미지 변경. */
  @Transactional
  public User updateProfileImage(Long userId, Long profileImageId) {
    User user = getById(userId);
    user.updateProfileImage(profileImageId);
    return userRepository.save(user);
  }

  /** 공부 시간 추가. 레벨/티어 자동 갱신. */
  @Transactional
  public void addStudyMinutes(Long userId, long minutes) {
    User user = getById(userId);
    user.addStudyMinutes(minutes);
    userRepository.save(user);
  }

  /** 마지막 로그인 시간 갱신. */
  @Transactional
  public void updateLastLogin(Long userId) {
    User user = getById(userId);
    user.updateLastLogin();
    userRepository.save(user);
  }

  /** 회원 탈퇴. 소프트 삭제로 deletedAt 설정. */
  @Transactional
  public void withdrawUser(Long userId) {
    User user = getById(userId);
    user.withdraw();
    userRepository.save(user);
  }

  private void validateDuplicateEmail(String email) {
    if (userRepository.existsByEmail(email)) {
      throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
    }
  }

  private void validateDuplicateNickname(String nickname) {
    if (userRepository.existsByNickname(nickname)) {
      throw new BusinessException(ErrorCode.DUPLICATE_NICKNAME);
    }
  }
}
