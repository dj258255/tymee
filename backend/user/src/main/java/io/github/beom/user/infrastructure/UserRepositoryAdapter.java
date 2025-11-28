package io.github.beom.user.infrastructure;

import io.github.beom.user.domain.AuthProvider;
import io.github.beom.user.domain.User;
import io.github.beom.user.domain.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 도메인 리포지토리 포트를 구현하는 어댑터 (헥사고날 아키텍처)
 */
@Repository
@RequiredArgsConstructor
public class UserRepositoryAdapter implements UserRepository {
    private final UserJpaRepository jpaRepository;

    @Override
    public Optional<User> findById(Long id) {
        return jpaRepository.findById(id)
            .map(UserEntity::toDomain);
    }

    @Override
    public User save(User user) {
        UserEntity entity;

        if (user.getId() == null) {
            // Create new entity
            entity = UserEntity.from(user);
        } else {
            // Update existing entity
            entity = jpaRepository.findById(user.getId())
                .orElseGet(() -> UserEntity.from(user));
            entity.updateFrom(user);
        }

        UserEntity saved = jpaRepository.save(entity);
        return saved.toDomain();
    }

    @Override
    public void delete(User user) {
        jpaRepository.deleteById(user.getId());
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return jpaRepository.findByEmail(email)
            .map(UserEntity::toDomain);
    }

    @Override
    public boolean existsByEmail(String email) {
        return jpaRepository.existsByEmail(email);
    }

    @Override
    public Optional<User> findByAuthProviderAndProviderId(AuthProvider authProvider, String providerId) {
        return jpaRepository.findByAuthProviderAndProviderId(authProvider, providerId)
            .map(UserEntity::toDomain);
    }

    @Override
    public boolean existsByAuthProviderAndProviderId(AuthProvider authProvider, String providerId) {
        return jpaRepository.existsByAuthProviderAndProviderId(authProvider, providerId);
    }
}