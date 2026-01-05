package io.github.beom.core.persistence.converter;

import jakarta.persistence.AttributeConverter;

/**
 * {@link CodedEnum}을 구현한 Enum을 DB 컬럼과 자동 변환하는 JPA Converter.
 *
 * <p>이 클래스를 상속하면 Enum의 {@code getCode()} 값으로 DB에 저장하고, DB에서 읽을 때 해당 코드를 가진 Enum 상수로 자동 변환한다.
 *
 * <h3>사용 방법</h3>
 *
 * <pre>{@code
 * // 1. Enum이 CodedEnum을 구현
 * public enum UserStatus implements CodedEnum {
 *     ACTIVE("A"), SUSPENDED("S"), WITHDRAWN("W");
 *     // ...
 * }
 *
 * // 2. Converter 클래스 생성
 * @Converter(autoApply = true)
 * public class UserStatusConverter extends CodedEnumConverter<UserStatus> {
 *     public UserStatusConverter() {
 *         super(UserStatus.class);
 *     }
 * }
 *
 * // 3. Entity에서 사용 (autoApply=true면 자동 적용)
 * @Entity
 * public class User {
 *     private UserStatus status;  // DB에 "A", "S", "W"로 저장됨
 * }
 * }</pre>
 *
 * <h3>왜 이 방식을 사용하는가?</h3>
 *
 * <ul>
 *   <li>{@code @Enumerated(EnumType.STRING)}: Enum 이름 변경 시 DB 데이터와 불일치
 *   <li>{@code @Enumerated(EnumType.ORDINAL)}: Enum 순서 변경 시 DB 데이터와 불일치
 *   <li>CodedEnumConverter: 코드 값은 변하지 않으므로 안전
 * </ul>
 *
 * @param <E> {@link CodedEnum}을 구현한 Enum 타입
 * @see CodedEnum
 * @see AbstractEnumConverter
 */
public abstract class CodedEnumConverter<E extends Enum<E> & CodedEnum>
    implements AttributeConverter<E, String> {

  private final Class<E> enumClass;

  /**
   * Converter 생성자.
   *
   * @param enumClass 변환할 Enum 클래스 (예: UserStatus.class)
   */
  protected CodedEnumConverter(Class<E> enumClass) {
    this.enumClass = enumClass;
  }

  /**
   * Enum을 DB 컬럼 값(String)으로 변환한다.
   *
   * <p>예: {@code UserStatus.ACTIVE} → {@code "A"}
   *
   * @param attribute 변환할 Enum 값 (null 가능)
   * @return Enum의 코드 값, null이면 null 반환
   */
  @Override
  public String convertToDatabaseColumn(E attribute) {
    if (attribute == null) {
      return null;
    }
    return attribute.getCode();
  }

  /**
   * DB 컬럼 값(String)을 Enum으로 변환한다.
   *
   * <p>예: {@code "A"} → {@code UserStatus.ACTIVE}
   *
   * <p>대소문자를 구분하지 않고 비교한다 (equalsIgnoreCase).
   *
   * @param dbData DB에서 읽은 코드 값 (null 또는 빈 문자열 가능)
   * @return 해당 코드를 가진 Enum 상수, null/빈 문자열이면 null 반환
   * @throws IllegalArgumentException 해당 코드를 가진 Enum이 없는 경우
   */
  @Override
  public E convertToEntityAttribute(String dbData) {
    if (dbData == null || dbData.isBlank()) {
      return null;
    }
    for (E enumConstant : enumClass.getEnumConstants()) {
      if (enumConstant.getCode().equalsIgnoreCase(dbData)) {
        return enumConstant;
      }
    }
    throw new IllegalArgumentException(
        "Unknown code '" + dbData + "' for enum " + enumClass.getSimpleName());
  }
}
