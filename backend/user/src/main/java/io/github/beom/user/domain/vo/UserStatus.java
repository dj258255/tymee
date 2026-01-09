package io.github.beom.user.domain.vo;

public enum UserStatus {
  ACTIVE,
  SUSPENDED,
  BANNED,
  WITHDRAWN;

  public boolean isActive() {
    return this == ACTIVE;
  }

  public boolean canLogin() {
    return this == ACTIVE;
  }
}
