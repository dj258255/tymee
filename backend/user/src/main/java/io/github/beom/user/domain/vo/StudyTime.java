package io.github.beom.user.domain.vo;

public record StudyTime(long totalMinutes) {

  public StudyTime {
    if (totalMinutes < 0) {
      throw new IllegalArgumentException("공부 시간은 0 이상이어야 합니다");
    }
  }

  public static StudyTime zero() {
    return new StudyTime(0);
  }

  public StudyTime add(long minutes) {
    if (minutes < 0) {
      throw new IllegalArgumentException("추가할 시간은 0 이상이어야 합니다");
    }
    return new StudyTime(this.totalMinutes + minutes);
  }

  public long toHours() {
    return totalMinutes / 60;
  }

  public UserTier calculateTier() {
    return UserTier.calculateByStudyHours(toHours());
  }
}
