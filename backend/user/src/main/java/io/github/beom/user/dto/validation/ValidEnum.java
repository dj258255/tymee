package io.github.beom.user.dto.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Enum 값 유효성 검증 커스텀 어노테이션.
 *
 * <p>Jakarta Validation에 enum 문자열 검증 어노테이션이 없어서 직접 구현.
 *
 * <p>문자열이 지정된 Enum의 유효한 값인지 검증한다. null 값은 유효한 것으로 처리 (PATCH 요청에서 null은 업데이트하지 않음).
 *
 * <h3>사용 예시</h3>
 *
 * <pre>{@code
 * @ValidEnum(enumClass = ThemeMode.class, message = "LIGHT, DARK, SYSTEM 중 하나여야 합니다")
 * String themeMode;
 * }</pre>
 *
 * <h3>장점</h3>
 *
 * <ul>
 *   <li>{@code @Pattern}과 달리 enum 값 추가 시 자동 반영
 *   <li>대소문자 무시 옵션 지원 (ignoreCase)
 *   <li>PATCH 요청의 부분 업데이트 지원 (null 허용)
 * </ul>
 */
@Documented
@Constraint(validatedBy = ValidEnumValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidEnum {
  String message() default "Invalid enum value";

  Class<?>[] groups() default {};

  Class<? extends Payload>[] payload() default {};

  Class<? extends Enum<?>> enumClass();

  boolean ignoreCase() default true;
}
