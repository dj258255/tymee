package io.github.beom.user.domain.vo;

import io.github.beom.core.persistence.converter.CodedEnum;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum UserTier implements CodedEnum {
  ELEMENTARY("elementary", 0),
  MIDDLE("middle", 20),
  HIGH("high", 50),
  BACHELOR_1("bachelor_1", 100),
  BACHELOR_2("bachelor_2", 300),
  BACHELOR_3("bachelor_3", 500),
  MASTER_1("master_1", 1000),
  MASTER_2("master_2", 2000),
  MASTER_3("master_3", 3000),
  DOCTOR("doctor", 5000),
  DOCTOR_EMERITUS("doctor_emeritus", 10000);

  private final String code;
  private final long requiredHours;

  public static UserTier calculateByStudyHours(long hours) {
    UserTier result = ELEMENTARY;
    for (UserTier tier : values()) {
      if (hours >= tier.requiredHours) {
        result = tier;
      } else {
        break;
      }
    }
    return result;
  }
}
