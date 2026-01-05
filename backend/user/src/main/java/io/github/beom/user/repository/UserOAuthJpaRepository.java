package io.github.beom.user.repository;

import io.github.beom.user.domain.vo.OAuthProvider;
import io.github.beom.user.entity.UserOAuthEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserOAuthJpaRepository extends JpaRepository<UserOAuthEntity, Long> {

  Optional<UserOAuthEntity> findByProviderAndProviderId(OAuthProvider provider, String providerId);

  List<UserOAuthEntity> findByUserId(Long userId);

  Optional<UserOAuthEntity> findByUserIdAndProvider(Long userId, OAuthProvider provider);
}
