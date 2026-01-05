package io.github.beom.core.persistence.converter;

import jakarta.persistence.AttributeConverter;
import java.util.function.Function;

/**
 * 범용 Enum-String 변환 JPA Converter의 추상 클래스.
 *
 * <p>{@link CodedEnumConverter}와 달리 변환 로직을 함수로 직접 주입받는 방식. 더 유연하지만, {@link CodedEnum}을 구현한 Enum이라면
 * {@link CodedEnumConverter}를 권장.
 *
 * <h3>사용 예시</h3>
 *
 * <pre>{@code
 * @Converter(autoApply = true)
 * public class FileTypeConverter extends AbstractEnumConverter<FileType> {
 *     public FileTypeConverter() {
 *         super(
 *             FileType::getCode,           // Enum → DB 변환 함수
 *             FileType::fromCode           // DB → Enum 변환 함수
 *         );
 *     }
 * }
 * }</pre>
 *
 * <h3>CodedEnumConverter와의 차이점</h3>
 *
 * <table border="1">
 *   <tr><th>항목</th><th>AbstractEnumConverter</th><th>CodedEnumConverter</th></tr>
 *   <tr><td>변환 로직</td><td>함수로 직접 주입</td><td>CodedEnum 인터페이스 사용</td></tr>
 *   <tr><td>유연성</td><td>높음</td><td>중간</td></tr>
 *   <tr><td>보일러플레이트</td><td>많음</td><td>적음</td></tr>
 *   <tr><td>권장 상황</td><td>특수한 변환 로직 필요 시</td><td>일반적인 경우</td></tr>
 * </table>
 *
 * @param <E> 변환할 Enum 타입
 * @see CodedEnumConverter
 */
public abstract class AbstractEnumConverter<E extends Enum<E>>
    implements AttributeConverter<E, String> {

  /** Enum → DB 컬럼 값 변환 함수 */
  private final Function<E, String> toDbValue;

  /** DB 컬럼 값 → Enum 변환 함수 */
  private final Function<String, E> toEnum;

  /**
   * Converter 생성자.
   *
   * @param toDbValue Enum을 DB 문자열로 변환하는 함수 (예: {@code FileType::getCode})
   * @param toEnum DB 문자열을 Enum으로 변환하는 함수 (예: {@code FileType::fromCode})
   */
  protected AbstractEnumConverter(Function<E, String> toDbValue, Function<String, E> toEnum) {
    this.toDbValue = toDbValue;
    this.toEnum = toEnum;
  }

  /**
   * Enum을 DB 컬럼 값(String)으로 변환한다.
   *
   * <p>생성자에서 주입받은 {@code toDbValue} 함수를 사용.
   *
   * @param attribute 변환할 Enum 값 (null 가능)
   * @return 변환된 DB 문자열, null이면 null 반환
   */
  @Override
  public String convertToDatabaseColumn(E attribute) {
    if (attribute == null) {
      return null;
    }
    return toDbValue.apply(attribute);
  }

  /**
   * DB 컬럼 값(String)을 Enum으로 변환한다.
   *
   * <p>생성자에서 주입받은 {@code toEnum} 함수를 사용.
   *
   * @param dbData DB에서 읽은 문자열 (null 또는 빈 문자열 가능)
   * @return 변환된 Enum, null/빈 문자열이면 null 반환
   */
  @Override
  public E convertToEntityAttribute(String dbData) {
    if (dbData == null || dbData.isBlank()) {
      return null;
    }
    return toEnum.apply(dbData);
  }
}
