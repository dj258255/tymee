package io.github.beom.user.repository;

import io.github.beom.user.domain.User;
import io.github.beom.user.entity.UserEntity;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class UserRepository {

  private final UserJpaRepository userJpaRepository;

  public Optional<User> findById(Long id) {
    return userJpaRepository.findById(id).map(UserEntity::toDomain);
  }

  public Optional<User> findByEmail(String email) {
    return userJpaRepository.findByEmail(email).map(UserEntity::toDomain);
  }

  public Optional<User> findActiveById(Long id) {
    return userJpaRepository.findActiveById(id).map(UserEntity::toDomain);
  }

  public Optional<User> findActiveByEmail(String email) {
    return userJpaRepository.findActiveByEmail(email).map(UserEntity::toDomain);
  }

  public boolean existsByEmail(String email) {
    return userJpaRepository.existsByEmail(email);
  }

  public boolean existsByNickname(String nickname) {
    return userJpaRepository.existsByNickname(nickname);
  }

  public boolean existsById(Long id) {
    return userJpaRepository.existsById(id);
  }

  public User save(User user) {
    UserEntity entity = UserEntity.from(user);
    UserEntity savedEntity = userJpaRepository.save(entity);
    return savedEntity.toDomain();
  }
}
