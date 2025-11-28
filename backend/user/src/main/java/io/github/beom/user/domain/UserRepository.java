package io.github.beom.user.domain;

import io.github.beom.domain.repository.Repository;

import java.util.Optional;

/**
 * User 리포지토리 포트 (Clean Architecture)
 */
public interface UserRepository extends Repository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    /**
     * OAuth 제공자와 제공자 ID로 사용자 조회
     */
    Optional<User> findByAuthProviderAndProviderId(AuthProvider authProvider, String providerId);

    /**
     * OAuth 제공자와 제공자 ID로 사용자 존재 여부 확인
     */
    boolean existsByAuthProviderAndProviderId(AuthProvider authProvider, String providerId);
}