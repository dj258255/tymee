package io.github.beom.user.dto.validation;

import static org.assertj.core.api.Assertions.assertThat;

import io.github.beom.user.domain.vo.Language;
import io.github.beom.user.domain.vo.ThemeMode;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import java.util.Set;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@DisplayName("ValidEnumValidator 테스트")
class ValidEnumValidatorTest {

  private static Validator validator;

  @BeforeAll
  static void setUp() {
    ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
    validator = factory.getValidator();
  }

  @Nested
  @DisplayName("ThemeMode 검증")
  class ThemeModeValidation {

    @Test
    @DisplayName("성공: LIGHT 유효")
    void lightIsValid() {
      var dto = new ThemeModeDto("LIGHT");
      Set<ConstraintViolation<ThemeModeDto>> violations = validator.validate(dto);
      assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("성공: DARK 유효")
    void darkIsValid() {
      var dto = new ThemeModeDto("DARK");
      Set<ConstraintViolation<ThemeModeDto>> violations = validator.validate(dto);
      assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("성공: SYSTEM 유효")
    void systemIsValid() {
      var dto = new ThemeModeDto("SYSTEM");
      Set<ConstraintViolation<ThemeModeDto>> violations = validator.validate(dto);
      assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("성공: 소문자도 유효 (ignoreCase=true)")
    void lowercaseIsValidWithIgnoreCase() {
      var dto = new ThemeModeDto("dark");
      Set<ConstraintViolation<ThemeModeDto>> violations = validator.validate(dto);
      assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("성공: null 유효 (PATCH 부분 업데이트)")
    void nullIsValid() {
      var dto = new ThemeModeDto(null);
      Set<ConstraintViolation<ThemeModeDto>> violations = validator.validate(dto);
      assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("실패: 유효하지 않은 값")
    void invalidValueRejected() {
      var dto = new ThemeModeDto("INVALID");
      Set<ConstraintViolation<ThemeModeDto>> violations = validator.validate(dto);
      assertThat(violations).hasSize(1);
      assertThat(violations.iterator().next().getMessage())
          .isEqualTo("LIGHT, DARK, SYSTEM 중 하나여야 합니다");
    }

    @Test
    @DisplayName("실패: 빈 문자열")
    void emptyStringRejected() {
      var dto = new ThemeModeDto("");
      Set<ConstraintViolation<ThemeModeDto>> violations = validator.validate(dto);
      assertThat(violations).hasSize(1);
    }

    @Test
    @DisplayName("실패: 공백 문자열")
    void whitespaceRejected() {
      var dto = new ThemeModeDto("  ");
      Set<ConstraintViolation<ThemeModeDto>> violations = validator.validate(dto);
      assertThat(violations).hasSize(1);
    }
  }

  @Nested
  @DisplayName("Language 검증")
  class LanguageValidation {

    @Test
    @DisplayName("성공: KO 유효")
    void koIsValid() {
      var dto = new LanguageDto("KO");
      Set<ConstraintViolation<LanguageDto>> violations = validator.validate(dto);
      assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("성공: EN 유효")
    void enIsValid() {
      var dto = new LanguageDto("EN");
      Set<ConstraintViolation<LanguageDto>> violations = validator.validate(dto);
      assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("성공: JA 유효")
    void jaIsValid() {
      var dto = new LanguageDto("JA");
      Set<ConstraintViolation<LanguageDto>> violations = validator.validate(dto);
      assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("성공: 소문자도 유효 (ignoreCase=true)")
    void lowercaseIsValidWithIgnoreCase() {
      var dto = new LanguageDto("ko");
      Set<ConstraintViolation<LanguageDto>> violations = validator.validate(dto);
      assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("실패: 지원하지 않는 언어")
    void unsupportedLanguageRejected() {
      var dto = new LanguageDto("FR");
      Set<ConstraintViolation<LanguageDto>> violations = validator.validate(dto);
      assertThat(violations).hasSize(1);
    }
  }

  @Nested
  @DisplayName("ignoreCase=false 검증")
  class CaseSensitiveValidation {

    @Test
    @DisplayName("성공: 대문자 유효")
    void uppercaseIsValid() {
      var dto = new CaseSensitiveDto("LIGHT");
      Set<ConstraintViolation<CaseSensitiveDto>> violations = validator.validate(dto);
      assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("실패: 소문자 거부 (ignoreCase=false)")
    void lowercaseRejectedWhenCaseSensitive() {
      var dto = new CaseSensitiveDto("light");
      Set<ConstraintViolation<CaseSensitiveDto>> violations = validator.validate(dto);
      assertThat(violations).hasSize(1);
    }

    @Test
    @DisplayName("실패: 혼합 대소문자 거부")
    void mixedCaseRejected() {
      var dto = new CaseSensitiveDto("Light");
      Set<ConstraintViolation<CaseSensitiveDto>> violations = validator.validate(dto);
      assertThat(violations).hasSize(1);
    }
  }

  /** 테스트용 DTO (ThemeMode). */
  private record ThemeModeDto(
      @ValidEnum(enumClass = ThemeMode.class, message = "LIGHT, DARK, SYSTEM 중 하나여야 합니다")
          String themeMode) {}

  /** 테스트용 DTO (Language). */
  private record LanguageDto(
      @ValidEnum(enumClass = Language.class, message = "KO, EN, JA 중 하나여야 합니다") String language) {}

  /** 테스트용 DTO (대소문자 구분). */
  private record CaseSensitiveDto(
      @ValidEnum(enumClass = ThemeMode.class, ignoreCase = false) String themeMode) {}
}
