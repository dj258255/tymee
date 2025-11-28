package io.github.beom.features.user;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Adapter implementing the domain repository port (Hexagonal Architecture)
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
}
