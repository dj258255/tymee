package io.github.beom.user.domain.vo;

/** 닉네임 Value Object. null 허용 (미설정 시 이메일로 표시). */
public record Nickname(String value) {

  private static final int MIN_LENGTH = 2;
  private static final int MAX_LENGTH = 50;

  public Nickname {
    // null 허용 (닉네임 미설정 상태)
    if (value != null && !value.isBlank()) {
      if (value.length() < MIN_LENGTH || value.length() > MAX_LENGTH) {
        throw new IllegalArgumentException(
            String.format("닉네임은 %d자 이상 %d자 이하여야 합니다", MIN_LENGTH, MAX_LENGTH));
      }
    }
  }

  public boolean isEmpty() {
    return value == null || value.isBlank();
  }

  @Override
  public String toString() {
    return value;
  }
}
