package io.github.beom.core.persistence.converter;

/**
 * DB에 저장할 코드 값을 가지는 Enum이 구현하는 인터페이스.
 *
 * <p>JPA에서 Enum을 DB에 저장할 때, 기본적으로 name() 또는 ordinal()을 사용한다. 하지만 이 방식은 Enum 이름/순서 변경 시 DB 데이터와 불일치가
 * 발생할 수 있다.
 *
 * <p>이 인터페이스를 구현하면 Enum과 독립적인 코드 값으로 DB에 저장할 수 있다.
 *
 * <h3>사용 예시</h3>
 *
 * <pre>{@code
 * public enum UserStatus implements CodedEnum {
 *     ACTIVE("A"),      // DB에는 "A"로 저장
 *     SUSPENDED("S"),   // DB에는 "S"로 저장
 *     WITHDRAWN("W");   // DB에는 "W"로 저장
 *
 *     private final String code;
 *
 *     UserStatus(String code) {
 *         this.code = code;
 *     }
 *
 *     @Override
 *     public String getCode() {
 *         return code;
 *     }
 * }
 * }</pre>
 *
 * @see CodedEnumConverter
 */
public interface CodedEnum {

  /**
   * DB에 저장될 코드 값을 반환한다.
   *
   * @return DB 저장용 코드 (예: "A", "S", "W")
   */
  String getCode();
}
