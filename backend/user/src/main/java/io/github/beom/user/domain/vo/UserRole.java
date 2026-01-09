package io.github.beom.user.domain.vo;

public enum UserRole {
  USER,
  MODERATOR,
  ADMIN;

  public boolean isAdmin() {
    return this == ADMIN;
  }

  public boolean isModerator() {
    return this == MODERATOR || this == ADMIN;
  }
}
