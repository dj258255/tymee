package io.github.beom.user.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import io.github.beom.user.domain.UserSettings;
import io.github.beom.user.domain.vo.Language;
import io.github.beom.user.domain.vo.ThemeMode;
import io.github.beom.user.dto.UserSettingsUpdateRequest;
import io.github.beom.user.mapper.UserSettingsMapper;
import io.github.beom.user.repository.UserSettingsRepository;
import java.time.LocalTime;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UserSettingsServiceTest {

  @Mock private UserSettingsRepository userSettingsRepository;
  @Mock private UserSettingsMapper userSettingsMapper;

  @InjectMocks private UserSettingsService userSettingsService;

  @Nested
  @DisplayName("설정 조회")
  class GetSettings {

    @Test
    @DisplayName("성공: 기존 설정 조회")
    void existingSettingsReturned() {
      // given
      var settings = UserSettings.createDefault(1L);
      given(userSettingsRepository.findOrCreateByUserId(1L)).willReturn(settings);

      // when
      var result = userSettingsService.getSettings(1L);

      // then
      assertThat(result.getUserId()).isEqualTo(1L);
      assertThat(result.getThemeMode()).isEqualTo(ThemeMode.SYSTEM);
      assertThat(result.getLanguage()).isEqualTo(Language.KO);
    }

    @Test
    @DisplayName("성공: 설정 없으면 기본값 자동 생성")
    void defaultSettingsCreatedWhenNotExists() {
      // given
      var defaultSettings = UserSettings.createDefault(1L);
      given(userSettingsRepository.findOrCreateByUserId(1L)).willReturn(defaultSettings);

      // when
      var result = userSettingsService.getSettings(1L);

      // then
      assertThat(result.isPushEnabled()).isTrue();
      assertThat(result.getPlannerStartHour()).isEqualTo(6);
      assertThat(result.getDailyGoalMinutes()).isEqualTo(180);
    }
  }

  @Nested
  @DisplayName("설정 업데이트")
  class UpdateSettings {

    @Test
    @DisplayName("성공: 테마 모드 변경")
    void themeModeUpdated() {
      // given
      var settings = UserSettings.createDefault(1L);
      var request =
          new UserSettingsUpdateRequest(
              "DARK", null, null, null, null, null, null, null, null, null, null, null, null, null,
              null, null, null, null, null, null);

      given(userSettingsRepository.findOrCreateByUserId(1L)).willReturn(settings);
      given(userSettingsRepository.save(any(UserSettings.class)))
          .willAnswer(inv -> inv.getArgument(0));

      // when
      userSettingsService.updateSettings(1L, request);

      // then
      verify(userSettingsMapper).updateFromRequest(request, settings);
      verify(userSettingsRepository).save(settings);
    }

    @Test
    @DisplayName("성공: 언어 변경")
    void languageUpdated() {
      // given
      var settings = UserSettings.createDefault(1L);
      var request =
          new UserSettingsUpdateRequest(
              null, "EN", null, null, null, null, null, null, null, null, null, null, null, null,
              null, null, null, null, null, null);

      given(userSettingsRepository.findOrCreateByUserId(1L)).willReturn(settings);
      given(userSettingsRepository.save(any(UserSettings.class)))
          .willAnswer(inv -> inv.getArgument(0));

      // when
      userSettingsService.updateSettings(1L, request);

      // then
      verify(userSettingsMapper).updateFromRequest(request, settings);
    }

    @Test
    @DisplayName("성공: 플래너 설정 부분 업데이트")
    void plannerSettingsPartiallyUpdated() {
      // given
      var settings = UserSettings.createDefault(1L);
      var request =
          new UserSettingsUpdateRequest(
              null, null, null, null, null, null, null, null, null, null, null, null, null, null,
              null, null, 8, 240, null, null);

      given(userSettingsRepository.findOrCreateByUserId(1L)).willReturn(settings);
      given(userSettingsRepository.save(any(UserSettings.class)))
          .willAnswer(inv -> inv.getArgument(0));

      // when
      userSettingsService.updateSettings(1L, request);

      // then
      verify(userSettingsMapper).updateFromRequest(request, settings);
    }

    @Test
    @DisplayName("성공: 푸시 알림 전체 off")
    void pushDisabled() {
      // given
      var settings = UserSettings.createDefault(1L);
      var request =
          new UserSettingsUpdateRequest(
              null, null, false, null, null, null, null, null, null, null, null, null, null, null,
              null, null, null, null, null, null);

      given(userSettingsRepository.findOrCreateByUserId(1L)).willReturn(settings);
      given(userSettingsRepository.save(any(UserSettings.class)))
          .willAnswer(inv -> inv.getArgument(0));

      // when
      userSettingsService.updateSettings(1L, request);

      // then
      verify(userSettingsMapper).updateFromRequest(request, settings);
    }

    @Test
    @DisplayName("성공: 일일 할일 알림 시간 변경")
    void dailyTaskTimeUpdated() {
      // given
      var settings = UserSettings.createDefault(1L);
      var request =
          new UserSettingsUpdateRequest(
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              LocalTime.of(9, 30),
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null);

      given(userSettingsRepository.findOrCreateByUserId(1L)).willReturn(settings);
      given(userSettingsRepository.save(any(UserSettings.class)))
          .willAnswer(inv -> inv.getArgument(0));

      // when
      userSettingsService.updateSettings(1L, request);

      // then
      verify(userSettingsMapper).updateFromRequest(request, settings);
    }

    @Test
    @DisplayName("성공: 개인정보 공개 설정 변경")
    void privacySettingsUpdated() {
      // given
      var settings = UserSettings.createDefault(1L);
      var request =
          new UserSettingsUpdateRequest(
              null, null, null, null, null, null, null, null, null, null, null, null, null, false,
              false, false, null, null, null, null);

      given(userSettingsRepository.findOrCreateByUserId(1L)).willReturn(settings);
      given(userSettingsRepository.save(any(UserSettings.class)))
          .willAnswer(inv -> inv.getArgument(0));

      // when
      userSettingsService.updateSettings(1L, request);

      // then
      verify(userSettingsMapper).updateFromRequest(request, settings);
    }

    @Test
    @DisplayName("성공: 여러 필드 동시 업데이트")
    void multipleFieldsUpdatedAtOnce() {
      // given
      var settings = UserSettings.createDefault(1L);
      var request =
          new UserSettingsUpdateRequest(
              "DARK",
              "EN",
              false,
              true,
              true,
              true,
              true,
              true,
              true,
              true,
              LocalTime.of(9, 0),
              true,
              15,
              false,
              false,
              true,
              8,
              300,
              2100,
              true);

      given(userSettingsRepository.findOrCreateByUserId(1L)).willReturn(settings);
      given(userSettingsRepository.save(any(UserSettings.class)))
          .willAnswer(inv -> inv.getArgument(0));

      // when
      userSettingsService.updateSettings(1L, request);

      // then
      verify(userSettingsMapper).updateFromRequest(request, settings);
      verify(userSettingsRepository).save(settings);
    }

    @Test
    @DisplayName("성공: 모든 필드 null (아무것도 변경 안함)")
    void noFieldsUpdatedWhenAllNull() {
      // given
      var settings = UserSettings.createDefault(1L);
      var request =
          new UserSettingsUpdateRequest(
              null, null, null, null, null, null, null, null, null, null, null, null, null, null,
              null, null, null, null, null, null);

      given(userSettingsRepository.findOrCreateByUserId(1L)).willReturn(settings);
      given(userSettingsRepository.save(any(UserSettings.class)))
          .willAnswer(inv -> inv.getArgument(0));

      // when
      userSettingsService.updateSettings(1L, request);

      // then
      verify(userSettingsMapper).updateFromRequest(request, settings);
      verify(userSettingsRepository).save(settings);
    }

    @Test
    @DisplayName("성공: plannerStartHour 경계값 0")
    void plannerStartHourMinBoundary() {
      // given
      var settings = UserSettings.createDefault(1L);
      var request =
          new UserSettingsUpdateRequest(
              null, null, null, null, null, null, null, null, null, null, null, null, null, null,
              null, null, 0, null, null, null);

      given(userSettingsRepository.findOrCreateByUserId(1L)).willReturn(settings);
      given(userSettingsRepository.save(any(UserSettings.class)))
          .willAnswer(inv -> inv.getArgument(0));

      // when
      userSettingsService.updateSettings(1L, request);

      // then
      verify(userSettingsMapper).updateFromRequest(request, settings);
    }

    @Test
    @DisplayName("성공: plannerStartHour 경계값 23")
    void plannerStartHourMaxBoundary() {
      // given
      var settings = UserSettings.createDefault(1L);
      var request =
          new UserSettingsUpdateRequest(
              null, null, null, null, null, null, null, null, null, null, null, null, null, null,
              null, null, 23, null, null, null);

      given(userSettingsRepository.findOrCreateByUserId(1L)).willReturn(settings);
      given(userSettingsRepository.save(any(UserSettings.class)))
          .willAnswer(inv -> inv.getArgument(0));

      // when
      userSettingsService.updateSettings(1L, request);

      // then
      verify(userSettingsMapper).updateFromRequest(request, settings);
    }

    @Test
    @DisplayName("성공: dailyGoalMinutes 경계값 0")
    void dailyGoalMinutesMinBoundary() {
      // given
      var settings = UserSettings.createDefault(1L);
      var request =
          new UserSettingsUpdateRequest(
              null, null, null, null, null, null, null, null, null, null, null, null, null, null,
              null, null, null, 0, null, null);

      given(userSettingsRepository.findOrCreateByUserId(1L)).willReturn(settings);
      given(userSettingsRepository.save(any(UserSettings.class)))
          .willAnswer(inv -> inv.getArgument(0));

      // when
      userSettingsService.updateSettings(1L, request);

      // then
      verify(userSettingsMapper).updateFromRequest(request, settings);
    }

    @Test
    @DisplayName("성공: dailyGoalMinutes 경계값 1440 (24시간)")
    void dailyGoalMinutesMaxBoundary() {
      // given
      var settings = UserSettings.createDefault(1L);
      var request =
          new UserSettingsUpdateRequest(
              null, null, null, null, null, null, null, null, null, null, null, null, null, null,
              null, null, null, 1440, null, null);

      given(userSettingsRepository.findOrCreateByUserId(1L)).willReturn(settings);
      given(userSettingsRepository.save(any(UserSettings.class)))
          .willAnswer(inv -> inv.getArgument(0));

      // when
      userSettingsService.updateSettings(1L, request);

      // then
      verify(userSettingsMapper).updateFromRequest(request, settings);
    }

    @Test
    @DisplayName("성공: weeklyGoalMinutes 경계값 10080 (7일)")
    void weeklyGoalMinutesMaxBoundary() {
      // given
      var settings = UserSettings.createDefault(1L);
      var request =
          new UserSettingsUpdateRequest(
              null, null, null, null, null, null, null, null, null, null, null, null, null, null,
              null, null, null, null, 10080, null);

      given(userSettingsRepository.findOrCreateByUserId(1L)).willReturn(settings);
      given(userSettingsRepository.save(any(UserSettings.class)))
          .willAnswer(inv -> inv.getArgument(0));

      // when
      userSettingsService.updateSettings(1L, request);

      // then
      verify(userSettingsMapper).updateFromRequest(request, settings);
    }

    @Test
    @DisplayName("성공: pushTimeBlockMinutesBefore 경계값 0")
    void pushTimeBlockMinutesBeforeMinBoundary() {
      // given
      var settings = UserSettings.createDefault(1L);
      var request =
          new UserSettingsUpdateRequest(
              null, null, null, null, null, null, null, null, null, null, null, null, 0, null, null,
              null, null, null, null, null);

      given(userSettingsRepository.findOrCreateByUserId(1L)).willReturn(settings);
      given(userSettingsRepository.save(any(UserSettings.class)))
          .willAnswer(inv -> inv.getArgument(0));

      // when
      userSettingsService.updateSettings(1L, request);

      // then
      verify(userSettingsMapper).updateFromRequest(request, settings);
    }

    @Test
    @DisplayName("성공: pushTimeBlockMinutesBefore 경계값 60")
    void pushTimeBlockMinutesBeforeMaxBoundary() {
      // given
      var settings = UserSettings.createDefault(1L);
      var request =
          new UserSettingsUpdateRequest(
              null, null, null, null, null, null, null, null, null, null, null, null, 60, null,
              null, null, null, null, null, null);

      given(userSettingsRepository.findOrCreateByUserId(1L)).willReturn(settings);
      given(userSettingsRepository.save(any(UserSettings.class)))
          .willAnswer(inv -> inv.getArgument(0));

      // when
      userSettingsService.updateSettings(1L, request);

      // then
      verify(userSettingsMapper).updateFromRequest(request, settings);
    }

    @Test
    @DisplayName("성공: pushDailyTaskTime 자정 (00:00)")
    void pushDailyTaskTimeMidnight() {
      // given
      var settings = UserSettings.createDefault(1L);
      var request =
          new UserSettingsUpdateRequest(
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              LocalTime.of(0, 0),
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null);

      given(userSettingsRepository.findOrCreateByUserId(1L)).willReturn(settings);
      given(userSettingsRepository.save(any(UserSettings.class)))
          .willAnswer(inv -> inv.getArgument(0));

      // when
      userSettingsService.updateSettings(1L, request);

      // then
      verify(userSettingsMapper).updateFromRequest(request, settings);
    }

    @Test
    @DisplayName("성공: pushDailyTaskTime 23:59")
    void pushDailyTaskTimeEndOfDay() {
      // given
      var settings = UserSettings.createDefault(1L);
      var request =
          new UserSettingsUpdateRequest(
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              LocalTime.of(23, 59),
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null);

      given(userSettingsRepository.findOrCreateByUserId(1L)).willReturn(settings);
      given(userSettingsRepository.save(any(UserSettings.class)))
          .willAnswer(inv -> inv.getArgument(0));

      // when
      userSettingsService.updateSettings(1L, request);

      // then
      verify(userSettingsMapper).updateFromRequest(request, settings);
    }

    @Test
    @DisplayName("성공: 소문자 themeMode")
    void lowercaseThemeMode() {
      // given
      var settings = UserSettings.createDefault(1L);
      var request =
          new UserSettingsUpdateRequest(
              "dark", null, null, null, null, null, null, null, null, null, null, null, null, null,
              null, null, null, null, null, null);

      given(userSettingsRepository.findOrCreateByUserId(1L)).willReturn(settings);
      given(userSettingsRepository.save(any(UserSettings.class)))
          .willAnswer(inv -> inv.getArgument(0));

      // when
      userSettingsService.updateSettings(1L, request);

      // then
      verify(userSettingsMapper).updateFromRequest(request, settings);
    }

    @Test
    @DisplayName("성공: 소문자 language")
    void lowercaseLanguage() {
      // given
      var settings = UserSettings.createDefault(1L);
      var request =
          new UserSettingsUpdateRequest(
              null, "en", null, null, null, null, null, null, null, null, null, null, null, null,
              null, null, null, null, null, null);

      given(userSettingsRepository.findOrCreateByUserId(1L)).willReturn(settings);
      given(userSettingsRepository.save(any(UserSettings.class)))
          .willAnswer(inv -> inv.getArgument(0));

      // when
      userSettingsService.updateSettings(1L, request);

      // then
      verify(userSettingsMapper).updateFromRequest(request, settings);
    }
  }

  @Nested
  @DisplayName("기본 설정 생성")
  class CreateDefaultSettings {

    @Test
    @DisplayName("성공: 신규 사용자 기본 설정 생성")
    void defaultSettingsCreatedForNewUser() {
      // given
      given(userSettingsRepository.existsByUserId(1L)).willReturn(false);
      given(userSettingsRepository.save(any(UserSettings.class)))
          .willAnswer(inv -> inv.getArgument(0));

      // when
      var result = userSettingsService.createDefaultSettings(1L);

      // then
      assertThat(result.getUserId()).isEqualTo(1L);
      assertThat(result.getThemeMode()).isEqualTo(ThemeMode.SYSTEM);
      assertThat(result.getLanguage()).isEqualTo(Language.KO);
      assertThat(result.isPushEnabled()).isTrue();
      verify(userSettingsRepository).save(any(UserSettings.class));
    }

    @Test
    @DisplayName("성공: 이미 설정 존재하면 기존 설정 반환")
    void existingSettingsReturnedIfAlreadyExists() {
      // given
      var existingSettings = UserSettings.createDefault(1L);
      given(userSettingsRepository.existsByUserId(1L)).willReturn(true);
      given(userSettingsRepository.findByUserId(1L)).willReturn(Optional.of(existingSettings));

      // when
      var result = userSettingsService.createDefaultSettings(1L);

      // then
      assertThat(result.getUserId()).isEqualTo(1L);
      verify(userSettingsRepository, never()).save(any(UserSettings.class));
    }
  }
}
