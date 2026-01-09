package io.github.beom.user.repository;

import io.github.beom.user.entity.UserSettingsEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserSettingsJpaRepository extends JpaRepository<UserSettingsEntity, Long> {}
