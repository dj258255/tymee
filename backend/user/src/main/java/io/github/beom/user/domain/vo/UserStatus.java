package io.github.beom.user.domain.vo;

import io.github.beom.core.persistence.converter.CodedEnum;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum UserStatus implements CodedEnum {
  ACTIVE("active"),
  SUSPENDED("suspended"),
  BANNED("banned"),
  WITHDRAWN("withdrawn");

  private final String code;

  public boolean isActive() {
    return this == ACTIVE;
  }

  public boolean canLogin() {
    return this == ACTIVE;
  }
}
