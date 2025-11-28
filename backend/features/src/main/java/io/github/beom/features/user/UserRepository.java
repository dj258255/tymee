package io.github.beom.features.user;

import io.github.beom.domain.repository.Repository;

import java.util.Optional;

/**
 * User repository port (Clean Architecture)
 */
public interface UserRepository extends Repository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}
