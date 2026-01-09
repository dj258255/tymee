package io.github.beom.user.domain.vo;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;

/** 닉네임 Value Object. null 허용 (미설정 시 이메일로 표시). 바이트 기준 제한: 1~30바이트 (한글 3바이트, 영문/숫자 1바이트) */
public record Nickname(String value) {

  private static final int MIN_BYTES = 1;
  private static final int MAX_BYTES = 30;
  private static final SecureRandom RANDOM = new SecureRandom();

  // 랜덤 닉네임 생성용 형용사/명사 (한글 기준)
  private static final String[] ADJECTIVES = {
    "귀여운", "용감한", "지혜로운", "행복한", "빛나는", "열정적인", "차분한", "씩씩한", "부지런한", "똑똒한"
  };
  private static final String[] NOUNS = {
    "학생", "공부왕", "독서가", "몽상가", "탐험가", "연구원", "챔피언", "스타", "천재", "용사"
  };

  public Nickname {
    // null 허용 (닉네임 미설정 상태)
    if (value != null) {
      // 공백만 있는 경우 체크
      if (value.isBlank()) {
        throw new IllegalArgumentException(String.format("닉네임은 %d바이트 이상이어야 합니다", MIN_BYTES));
      }
      int byteLength = getByteLength(value);
      if (byteLength < MIN_BYTES || byteLength > MAX_BYTES) {
        throw new IllegalArgumentException(
            String.format(
                "닉네임은 %d바이트 이상 %d바이트 이하여야 합니다 (현재: %d바이트)", MIN_BYTES, MAX_BYTES, byteLength));
      }
    }
  }

  /** UTF-8 기준 바이트 길이 계산 */
  public static int getByteLength(String str) {
    if (str == null) {
      return 0;
    }
    return str.getBytes(StandardCharsets.UTF_8).length;
  }

  /** 현재 닉네임의 바이트 길이 */
  public int byteLength() {
    return getByteLength(value);
  }

  /** 최대 바이트 제한 */
  public static int maxBytes() {
    return MAX_BYTES;
  }

  /** 유니크한 랜덤 닉네임 생성 (형용사+명사+숫자 조합) */
  public static Nickname generateRandom() {
    String adjective = ADJECTIVES[RANDOM.nextInt(ADJECTIVES.length)];
    String noun = NOUNS[RANDOM.nextInt(NOUNS.length)];
    int number = RANDOM.nextInt(1000); // 0~999

    String candidate = adjective + noun + number;

    // 30바이트 초과 시 숫자만 사용
    if (getByteLength(candidate) > MAX_BYTES) {
      candidate = noun + number;
    }

    // 그래도 초과하면 user_ + 타임스탬프 축약
    if (getByteLength(candidate) > MAX_BYTES) {
      candidate = "user" + (System.currentTimeMillis() % 100000000);
    }

    return new Nickname(candidate);
  }

  public boolean isEmpty() {
    return value == null || value.isBlank();
  }

  @Override
  public String toString() {
    return value;
  }
}
