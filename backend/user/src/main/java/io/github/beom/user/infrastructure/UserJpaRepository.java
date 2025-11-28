package io.github.beom.user.infrastructure;

import io.github.beom.user.domain.AuthProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Spring Data JPA 리포지토리 인터페이스
 */
public interface UserJpaRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<UserEntity> findByAuthProviderAndProviderId(AuthProvider authProvider, String providerId);
    boolean existsByAuthProviderAndProviderId(AuthProvider authProvider, String providerId);
}