package io.github.beom.user.domain.vo;

public record Nickname(String value) {

  private static final int MIN_LENGTH = 2;
  private static final int MAX_LENGTH = 50;

  public Nickname {
    if (value == null || value.isBlank()) {
      throw new IllegalArgumentException("닉네임은 필수입니다");
    }
    if (value.length() < MIN_LENGTH || value.length() > MAX_LENGTH) {
      throw new IllegalArgumentException(
          String.format("닉네임은 %d자 이상 %d자 이하여야 합니다", MIN_LENGTH, MAX_LENGTH));
    }
  }

  @Override
  public String toString() {
    return value;
  }
}
