package io.github.beom.user.dto;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import java.util.Set;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@DisplayName("UserSettingsUpdateRequest Validation 테스트")
class UserSettingsUpdateRequestValidationTest {

  private static Validator validator;

  @BeforeAll
  static void setUp() {
    ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
    validator = factory.getValidator();
  }

  @Nested
  @DisplayName("themeMode 검증")
  class ThemeModeValidation {

    @Test
    @DisplayName("성공: LIGHT")
    void lightIsValid() {
      var request = createRequest("LIGHT", null, null, null, null);
      assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    @DisplayName("성공: DARK")
    void darkIsValid() {
      var request = createRequest("DARK", null, null, null, null);
      assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    @DisplayName("성공: SYSTEM")
    void systemIsValid() {
      var request = createRequest("SYSTEM", null, null, null, null);
      assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    @DisplayName("성공: 소문자 dark")
    void lowercaseIsValid() {
      var request = createRequest("dark", null, null, null, null);
      assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    @DisplayName("성공: null (부분 업데이트)")
    void nullIsValid() {
      var request = createRequest(null, null, null, null, null);
      assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    @DisplayName("실패: 유효하지 않은 값")
    void invalidValueRejected() {
      var request = createRequest("INVALID", null, null, null, null);
      Set<ConstraintViolation<UserSettingsUpdateRequest>> violations = validator.validate(request);
      assertThat(violations).hasSize(1);
      assertThat(violations.iterator().next().getMessage()).contains("LIGHT", "DARK", "SYSTEM");
    }

    @Test
    @DisplayName("실패: 빈 문자열")
    void emptyStringRejected() {
      var request = createRequest("", null, null, null, null);
      Set<ConstraintViolation<UserSettingsUpdateRequest>> violations = validator.validate(request);
      assertThat(violations).hasSize(1);
    }
  }

  @Nested
  @DisplayName("language 검증")
  class LanguageValidation {

    @Test
    @DisplayName("성공: KO")
    void koIsValid() {
      var request = createRequest(null, "KO", null, null, null);
      assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    @DisplayName("성공: EN")
    void enIsValid() {
      var request = createRequest(null, "EN", null, null, null);
      assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    @DisplayName("성공: JA")
    void jaIsValid() {
      var request = createRequest(null, "JA", null, null, null);
      assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    @DisplayName("성공: 소문자 ko")
    void lowercaseIsValid() {
      var request = createRequest(null, "ko", null, null, null);
      assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    @DisplayName("실패: 지원하지 않는 언어 FR")
    void unsupportedLanguageRejected() {
      var request = createRequest(null, "FR", null, null, null);
      Set<ConstraintViolation<UserSettingsUpdateRequest>> violations = validator.validate(request);
      assertThat(violations).hasSize(1);
      assertThat(violations.iterator().next().getMessage()).contains("KO", "JA", "EN");
    }

    @Test
    @DisplayName("실패: 빈 문자열")
    void emptyStringRejected() {
      var request = createRequest(null, "", null, null, null);
      Set<ConstraintViolation<UserSettingsUpdateRequest>> violations = validator.validate(request);
      assertThat(violations).hasSize(1);
    }
  }

  @Nested
  @DisplayName("plannerStartHour 검증")
  class PlannerStartHourValidation {

    @Test
    @DisplayName("성공: 경계값 0")
    void minBoundaryIsValid() {
      var request = createRequest(null, null, 0, null, null);
      assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    @DisplayName("성공: 경계값 23")
    void maxBoundaryIsValid() {
      var request = createRequest(null, null, 23, null, null);
      assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    @DisplayName("성공: 중간값 12")
    void midValueIsValid() {
      var request = createRequest(null, null, 12, null, null);
      assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    @DisplayName("실패: 음수 -1")
    void negativeValueRejected() {
      var request = createRequest(null, null, -1, null, null);
      Set<ConstraintViolation<UserSettingsUpdateRequest>> violations = validator.validate(request);
      assertThat(violations).hasSize(1);
      assertThat(violations.iterator().next().getMessage()).contains("0 이상");
    }

    @Test
    @DisplayName("실패: 초과값 24")
    void exceedingValueRejected() {
      var request = createRequest(null, null, 24, null, null);
      Set<ConstraintViolation<UserSettingsUpdateRequest>> violations = validator.validate(request);
      assertThat(violations).hasSize(1);
      assertThat(violations.iterator().next().getMessage()).contains("23 이하");
    }

    @Test
    @DisplayName("실패: 큰 초과값 100")
    void largeExceedingValueRejected() {
      var request = createRequest(null, null, 100, null, null);
      Set<ConstraintViolation<UserSettingsUpdateRequest>> violations = validator.validate(request);
      assertThat(violations).hasSize(1);
    }
  }

  @Nested
  @DisplayName("dailyGoalMinutes 검증")
  class DailyGoalMinutesValidation {

    @Test
    @DisplayName("성공: 경계값 0")
    void minBoundaryIsValid() {
      var request = createRequest(null, null, null, 0, null);
      assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    @DisplayName("성공: 경계값 1440 (24시간)")
    void maxBoundaryIsValid() {
      var request = createRequest(null, null, null, 1440, null);
      assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    @DisplayName("성공: 일반값 180 (3시간)")
    void normalValueIsValid() {
      var request = createRequest(null, null, null, 180, null);
      assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    @DisplayName("실패: 음수 -1")
    void negativeValueRejected() {
      var request = createRequest(null, null, null, -1, null);
      Set<ConstraintViolation<UserSettingsUpdateRequest>> violations = validator.validate(request);
      assertThat(violations).hasSize(1);
      assertThat(violations.iterator().next().getMessage()).contains("0 이상");
    }

    @Test
    @DisplayName("실패: 초과값 1441")
    void exceedingValueRejected() {
      var request = createRequest(null, null, null, 1441, null);
      Set<ConstraintViolation<UserSettingsUpdateRequest>> violations = validator.validate(request);
      assertThat(violations).hasSize(1);
      assertThat(violations.iterator().next().getMessage()).contains("1440 이하");
    }
  }

  @Nested
  @DisplayName("weeklyGoalMinutes 검증")
  class WeeklyGoalMinutesValidation {

    @Test
    @DisplayName("성공: 경계값 0")
    void minBoundaryIsValid() {
      var request = createRequest(null, null, null, null, 0);
      assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    @DisplayName("성공: 경계값 10080 (7일)")
    void maxBoundaryIsValid() {
      var request = createRequest(null, null, null, null, 10080);
      assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    @DisplayName("성공: 일반값 1260 (21시간)")
    void normalValueIsValid() {
      var request = createRequest(null, null, null, null, 1260);
      assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    @DisplayName("실패: 음수 -1")
    void negativeValueRejected() {
      var request = createRequest(null, null, null, null, -1);
      Set<ConstraintViolation<UserSettingsUpdateRequest>> violations = validator.validate(request);
      assertThat(violations).hasSize(1);
      assertThat(violations.iterator().next().getMessage()).contains("0 이상");
    }

    @Test
    @DisplayName("실패: 초과값 10081")
    void exceedingValueRejected() {
      var request = createRequest(null, null, null, null, 10081);
      Set<ConstraintViolation<UserSettingsUpdateRequest>> violations = validator.validate(request);
      assertThat(violations).hasSize(1);
      assertThat(violations.iterator().next().getMessage()).contains("10080 이하");
    }
  }

  @Nested
  @DisplayName("복합 검증")
  class MultipleValidation {

    @Test
    @DisplayName("성공: 모든 필드가 유효한 값")
    void allValidFieldsPass() {
      var request =
          new UserSettingsUpdateRequest("DARK", "EN", false, false, true, 8, 300, 2100, true);
      assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    @DisplayName("성공: 모든 필드가 null (부분 업데이트)")
    void allNullFieldsPass() {
      var request =
          new UserSettingsUpdateRequest(null, null, null, null, null, null, null, null, null);
      assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    @DisplayName("실패: 여러 필드가 유효하지 않음")
    void multipleInvalidFieldsRejected() {
      var request =
          new UserSettingsUpdateRequest(
              "INVALID", // 잘못된 themeMode
              "FR", // 잘못된 language
              null, null, null, -1, // 잘못된 plannerStartHour
              -1, // 잘못된 dailyGoalMinutes
              -1, // 잘못된 weeklyGoalMinutes
              null);
      Set<ConstraintViolation<UserSettingsUpdateRequest>> violations = validator.validate(request);
      assertThat(violations).hasSize(5);
    }

    @Test
    @DisplayName("실패: 모든 숫자 필드가 범위 초과")
    void allNumericFieldsExceedingRejected() {
      var request =
          new UserSettingsUpdateRequest(
              null, null, null, null, null, 24, // 초과
              1441, // 초과
              10081, // 초과
              null);
      Set<ConstraintViolation<UserSettingsUpdateRequest>> violations = validator.validate(request);
      assertThat(violations).hasSize(3);
    }
  }

  /** 테스트용 헬퍼 메소드. */
  private UserSettingsUpdateRequest createRequest(
      String themeMode,
      String language,
      Integer plannerStartHour,
      Integer dailyGoalMinutes,
      Integer weeklyGoalMinutes) {
    return new UserSettingsUpdateRequest(
        themeMode,
        language,
        null,
        null,
        null,
        plannerStartHour,
        dailyGoalMinutes,
        weeklyGoalMinutes,
        null);
  }
}
