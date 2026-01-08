package io.github.beom.user.repository;

import io.github.beom.user.entity.UserEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserJpaRepository extends JpaRepository<UserEntity, Long> {

  Optional<UserEntity> findByEmail(String email);

  Optional<UserEntity> findByNickname(String nickname);

  boolean existsByEmail(String email);

  boolean existsByNickname(String nickname);

  @Query("SELECT u FROM UserEntity u WHERE u.id = :id AND u.deletedAt IS NULL")
  Optional<UserEntity> findActiveById(@Param("id") Long id);

  @Query("SELECT u FROM UserEntity u WHERE u.email = :email AND u.deletedAt IS NULL")
  Optional<UserEntity> findActiveByEmail(@Param("email") String email);

  @Query(
      "SELECT u FROM UserEntity u WHERE u.deletedAt IS NULL "
          + "AND LOWER(u.nickname) LIKE LOWER(CONCAT('%', :keyword, '%')) "
          + "ORDER BY u.nickname ASC")
  List<UserEntity> searchByNickname(@Param("keyword") String keyword);
}
