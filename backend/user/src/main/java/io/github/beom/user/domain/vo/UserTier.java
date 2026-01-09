package io.github.beom.user.domain.vo;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum UserTier {
  ELEMENTARY(0),
  MIDDLE(20),
  HIGH(50),
  BACHELOR_1(100),
  BACHELOR_2(300),
  BACHELOR_3(500),
  MASTER_1(1000),
  MASTER_2(2000),
  MASTER_3(3000),
  DOCTOR(5000),
  DOCTOR_EMERITUS(10000);

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
