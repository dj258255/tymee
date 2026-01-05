package io.github.beom.user.domain.vo;

import io.github.beom.core.persistence.converter.CodedEnum;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum UserRole implements CodedEnum {
  USER("user"),
  MODERATOR("moderator"),
  ADMIN("admin");

  private final String code;

  public boolean isAdmin() {
    return this == ADMIN;
  }

  public boolean isModerator() {
    return this == MODERATOR || this == ADMIN;
  }
}
