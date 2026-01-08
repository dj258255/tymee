package io.github.beom.core.security;

import java.security.Principal;

/**
 * 인증된 사용자 정보를 담는 Principal.
 *
 * @param userId 사용자 ID
 * @param email 사용자 이메일
 * @param role 사용자 역할 (USER, MODERATOR, ADMIN)
 */
public record UserPrincipal(Long userId, String email, String role) implements Principal {

  @Override
  public String getName() {
    return String.valueOf(userId);
  }
}
