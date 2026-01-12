package io.github.beom.user.repository;

import io.github.beom.user.entity.UserNotificationSettingsEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserNotificationSettingsJpaRepository
    extends JpaRepository<UserNotificationSettingsEntity, Long> {}
