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

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

  private final UserRepository userRepository;

  public User getById(Long id) {
    return userRepository
        .findActiveById(id)
        .orElseThrow(
            () -> new EntityNotFoundException(ErrorCode.USER_NOT_FOUND, "사용자를 찾을 수 없습니다: " + id));
  }

  public User getByEmail(String email) {
    return userRepository
        .findActiveByEmail(email)
        .orElseThrow(
            () ->
                new EntityNotFoundException(ErrorCode.USER_NOT_FOUND, "사용자를 찾을 수 없습니다: " + email));
  }

  public boolean existsByEmail(String email) {
    return userRepository.existsByEmail(email);
  }

  public boolean existsByNickname(String nickname) {
    return userRepository.existsByNickname(nickname);
  }

  @Transactional
  public User createUser(String email, String password, String nickname) {
    validateDuplicateEmail(email);
    validateDuplicateNickname(nickname);

    User user = User.create(new Email(email), password, new Nickname(nickname));
    return userRepository.save(user);
  }

  @Transactional
  public User createOAuthUser(String email, String nickname) {
    validateDuplicateEmail(email);
    validateDuplicateNickname(nickname);

    User user = User.createOAuthUser(new Email(email), new Nickname(nickname));
    return userRepository.save(user);
  }

  @Transactional
  public User updateProfile(Long userId, String nickname, String bio) {
    User user = getById(userId);

    if (!user.getNickname().value().equals(nickname)) {
      validateDuplicateNickname(nickname);
    }

    user.updateProfile(new Nickname(nickname), bio);
    return userRepository.save(user);
  }

  @Transactional
  public User updateProfileImage(Long userId, Long profileImageId) {
    User user = getById(userId);
    user.updateProfileImage(profileImageId);
    return userRepository.save(user);
  }

  @Transactional
  public void addStudyMinutes(Long userId, long minutes) {
    User user = getById(userId);
    user.addStudyMinutes(minutes);
    userRepository.save(user);
  }

  @Transactional
  public void updateLastLogin(Long userId) {
    User user = getById(userId);
    user.updateLastLogin();
    userRepository.save(user);
  }

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
