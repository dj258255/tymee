package io.github.beom.user.dto.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * {@link ValidEnum} 어노테이션의 검증기.
 *
 * <p>초기화 시 enum의 모든 값을 Set으로 저장하고, 입력값이 해당 Set에 포함되는지 확인한다.
 *
 * @see ValidEnum
 */
public class ValidEnumValidator implements ConstraintValidator<ValidEnum, String> {

  private Set<String> acceptedValues;
  private boolean ignoreCase;

  @Override
  public void initialize(ValidEnum annotation) {
    ignoreCase = annotation.ignoreCase();
    acceptedValues =
        Arrays.stream(annotation.enumClass().getEnumConstants())
            .map(e -> ignoreCase ? e.name().toUpperCase() : e.name())
            .collect(Collectors.toSet());
  }

  @Override
  public boolean isValid(String value, ConstraintValidatorContext context) {
    // null은 유효 (PATCH에서 null은 업데이트하지 않음)
    if (value == null) {
      return true;
    }
    String checkValue = ignoreCase ? value.toUpperCase() : value;
    return acceptedValues.contains(checkValue);
  }
}
