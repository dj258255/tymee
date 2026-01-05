package io.github.beom.user.repository;

import io.github.beom.user.entity.UserBlockEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserBlockJpaRepository extends JpaRepository<UserBlockEntity, Long> {

  Optional<UserBlockEntity> findByBlockerIdAndBlockedId(Long blockerId, Long blockedId);

  List<UserBlockEntity> findAllByBlockerId(Long blockerId);

  boolean existsByBlockerIdAndBlockedId(Long blockerId, Long blockedId);

  void deleteByBlockerIdAndBlockedId(Long blockerId, Long blockedId);
}
