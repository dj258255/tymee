package io.github.beom.user.repository;

import io.github.beom.user.domain.UserOAuth;
import io.github.beom.user.domain.vo.OAuthProvider;
import io.github.beom.user.entity.UserOAuthEntity;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class UserOAuthRepository {

  private final UserOAuthJpaRepository userOAuthJpaRepository;

  public Optional<UserOAuth> findByProviderAndProviderId(
      OAuthProvider provider, String providerId) {
    return userOAuthJpaRepository
        .findByProviderAndProviderId(provider, providerId)
        .map(UserOAuthEntity::toDomain);
  }

  public List<UserOAuth> findByUserId(Long userId) {
    return userOAuthJpaRepository.findByUserId(userId).stream()
        .map(UserOAuthEntity::toDomain)
        .toList();
  }

  public Optional<UserOAuth> findByUserIdAndProvider(Long userId, OAuthProvider provider) {
    return userOAuthJpaRepository
        .findByUserIdAndProvider(userId, provider)
        .map(UserOAuthEntity::toDomain);
  }

  public UserOAuth save(UserOAuth userOAuth) {
    UserOAuthEntity entity = UserOAuthEntity.from(userOAuth);
    UserOAuthEntity savedEntity = userOAuthJpaRepository.save(entity);
    return savedEntity.toDomain();
  }
}
