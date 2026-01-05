package io.github.beom.user.repository;

import io.github.beom.user.domain.UserBlock;
import io.github.beom.user.entity.UserBlockEntity;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class UserBlockRepository {

  private final UserBlockJpaRepository jpaRepository;

  public UserBlock save(UserBlock userBlock) {
    UserBlockEntity entity = UserBlockEntity.from(userBlock);
    return jpaRepository.save(entity).toDomain();
  }

  public Optional<UserBlock> findByBlockerIdAndBlockedId(Long blockerId, Long blockedId) {
    return jpaRepository
        .findByBlockerIdAndBlockedId(blockerId, blockedId)
        .map(UserBlockEntity::toDomain);
  }

  public List<UserBlock> findAllByBlockerId(Long blockerId) {
    return jpaRepository.findAllByBlockerId(blockerId).stream()
        .map(UserBlockEntity::toDomain)
        .toList();
  }

  public boolean existsByBlockerIdAndBlockedId(Long blockerId, Long blockedId) {
    return jpaRepository.existsByBlockerIdAndBlockedId(blockerId, blockedId);
  }

  public void deleteByBlockerIdAndBlockedId(Long blockerId, Long blockedId) {
    jpaRepository.deleteByBlockerIdAndBlockedId(blockerId, blockedId);
  }
}
