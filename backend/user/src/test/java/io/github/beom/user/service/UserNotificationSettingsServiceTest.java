package io.github.beom.user.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import io.github.beom.user.domain.UserNotificationSettings;
import io.github.beom.user.dto.UserNotificationSettingsUpdateRequest;
import io.github.beom.user.repository.UserNotificationSettingsRepository;
import java.time.LocalTime;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UserNotificationSettingsServiceTest {

  @Mock private UserNotificationSettingsRepository repository;

  @InjectMocks private UserNotificationSettingsService service;

  @Nested
  @DisplayName("알림 설정 조회")
  class GetSettings {

    @Test
    @DisplayName("성공: 기존 설정 조회")
    void existingSettingsReturned() {
      // given
      var settings = UserNotificationSettings.createDefault(1L);
      given(repository.findOrCreateByUserId(1L)).willReturn(settings);

      // when
      var result = service.getSettings(1L);

      // then
      assertThat(result.getUserId()).isEqualTo(1L);
      assertThat(result.isPushEnabled()).isTrue();
    }

    @Test
    @DisplayName("성공: 설정 없으면 기본값 자동 생성")
    void defaultSettingsCreatedWhenNotExists() {
      // given
      var defaultSettings = UserNotificationSettings.createDefault(1L);
      given(repository.findOrCreateByUserId(1L)).willReturn(defaultSettings);

      // when
      var result = service.getSettings(1L);

      // then
      assertThat(result.isPushEnabled()).isTrue();
      assertThat(result.isPushFriendRequest()).isTrue();
      assertThat(result.getPushDailyTaskTime()).isEqualTo(LocalTime.of(8, 0));
      assertThat(result.getPushTimeBlockMinutesBefore()).isEqualTo(10);
    }
  }

  @Nested
  @DisplayName("알림 설정 업데이트")
  class UpdateSettings {

    @Test
    @DisplayName("성공: 푸시 알림 전체 off")
    void pushDisabled() {
      // given
      var settings = UserNotificationSettings.createDefault(1L);
      var request =
          new UserNotificationSettingsUpdateRequest(
              false, null, null, null, null, null, null, null, null, null, null);

      given(repository.findOrCreateByUserId(1L)).willReturn(settings);
      given(repository.save(any(UserNotificationSettings.class)))
          .willAnswer(inv -> inv.getArgument(0));

      // when
      var result = service.updateSettings(1L, request);

      // then
      assertThat(result.isPushEnabled()).isFalse();
      verify(repository).save(settings);
    }

    @Test
    @DisplayName("성공: 개별 푸시 알림 설정 변경")
    void individualPushSettingsUpdated() {
      // given
      var settings = UserNotificationSettings.createDefault(1L);
      var request =
          new UserNotificationSettingsUpdateRequest(
              null, false, true, false, true, false, true, null, null, null, null);

      given(repository.findOrCreateByUserId(1L)).willReturn(settings);
      given(repository.save(any(UserNotificationSettings.class)))
          .willAnswer(inv -> inv.getArgument(0));

      // when
      var result = service.updateSettings(1L, request);

      // then
      assertThat(result.isPushFriendRequest()).isFalse();
      assertThat(result.isPushChatMessage()).isTrue();
      assertThat(result.isPushPostComment()).isFalse();
      assertThat(result.isPushLike()).isTrue();
      assertThat(result.isPushGroupActivity()).isFalse();
      assertThat(result.isPushPopularPost()).isTrue();
    }

    @Test
    @DisplayName("성공: 일일 할일 알림 설정 변경")
    void dailyTaskSettingsUpdated() {
      // given
      var settings = UserNotificationSettings.createDefault(1L);
      var newTime = LocalTime.of(9, 30);
      var request =
          new UserNotificationSettingsUpdateRequest(
              null, null, null, null, null, null, null, false, newTime, null, null);

      given(repository.findOrCreateByUserId(1L)).willReturn(settings);
      given(repository.save(any(UserNotificationSettings.class)))
          .willAnswer(inv -> inv.getArgument(0));

      // when
      var result = service.updateSettings(1L, request);

      // then
      assertThat(result.isPushDailyTaskEnabled()).isFalse();
      assertThat(result.getPushDailyTaskTime()).isEqualTo(newTime);
    }

    @Test
    @DisplayName("성공: 시간표 알림 설정 변경")
    void timeBlockSettingsUpdated() {
      // given
      var settings = UserNotificationSettings.createDefault(1L);
      var request =
          new UserNotificationSettingsUpdateRequest(
              null, null, null, null, null, null, null, null, null, false, 30);

      given(repository.findOrCreateByUserId(1L)).willReturn(settings);
      given(repository.save(any(UserNotificationSettings.class)))
          .willAnswer(inv -> inv.getArgument(0));

      // when
      var result = service.updateSettings(1L, request);

      // then
      assertThat(result.isPushTimeBlockEnabled()).isFalse();
      assertThat(result.getPushTimeBlockMinutesBefore()).isEqualTo(30);
    }

    @Test
    @DisplayName("성공: 여러 필드 동시 업데이트")
    void multipleFieldsUpdatedAtOnce() {
      // given
      var settings = UserNotificationSettings.createDefault(1L);
      var request =
          new UserNotificationSettingsUpdateRequest(
              false, true, true, true, true, true, false, true, LocalTime.of(7, 0), true, 15);

      given(repository.findOrCreateByUserId(1L)).willReturn(settings);
      given(repository.save(any(UserNotificationSettings.class)))
          .willAnswer(inv -> inv.getArgument(0));

      // when
      var result = service.updateSettings(1L, request);

      // then
      assertThat(result.isPushEnabled()).isFalse();
      assertThat(result.isPushPopularPost()).isFalse();
      assertThat(result.getPushDailyTaskTime()).isEqualTo(LocalTime.of(7, 0));
      assertThat(result.getPushTimeBlockMinutesBefore()).isEqualTo(15);
      verify(repository).save(settings);
    }

    @Test
    @DisplayName("성공: 모든 필드 null (아무것도 변경 안함)")
    void noFieldsUpdatedWhenAllNull() {
      // given
      var settings = UserNotificationSettings.createDefault(1L);
      var request =
          new UserNotificationSettingsUpdateRequest(
              null, null, null, null, null, null, null, null, null, null, null);

      given(repository.findOrCreateByUserId(1L)).willReturn(settings);
      given(repository.save(any(UserNotificationSettings.class)))
          .willAnswer(inv -> inv.getArgument(0));

      // when
      var result = service.updateSettings(1L, request);

      // then
      assertThat(result.isPushEnabled()).isTrue();
      verify(repository).save(settings);
    }

    @Test
    @DisplayName("성공: pushTimeBlockMinutesBefore 경계값 0")
    void pushTimeBlockMinutesBeforeMinBoundary() {
      // given
      var settings = UserNotificationSettings.createDefault(1L);
      var request =
          new UserNotificationSettingsUpdateRequest(
              null, null, null, null, null, null, null, null, null, null, 0);

      given(repository.findOrCreateByUserId(1L)).willReturn(settings);
      given(repository.save(any(UserNotificationSettings.class)))
          .willAnswer(inv -> inv.getArgument(0));

      // when
      var result = service.updateSettings(1L, request);

      // then
      assertThat(result.getPushTimeBlockMinutesBefore()).isEqualTo(0);
    }

    @Test
    @DisplayName("성공: pushTimeBlockMinutesBefore 경계값 60")
    void pushTimeBlockMinutesBeforeMaxBoundary() {
      // given
      var settings = UserNotificationSettings.createDefault(1L);
      var request =
          new UserNotificationSettingsUpdateRequest(
              null, null, null, null, null, null, null, null, null, null, 60);

      given(repository.findOrCreateByUserId(1L)).willReturn(settings);
      given(repository.save(any(UserNotificationSettings.class)))
          .willAnswer(inv -> inv.getArgument(0));

      // when
      var result = service.updateSettings(1L, request);

      // then
      assertThat(result.getPushTimeBlockMinutesBefore()).isEqualTo(60);
    }

    @Test
    @DisplayName("성공: pushDailyTaskTime 자정 (00:00)")
    void pushDailyTaskTimeMidnight() {
      // given
      var settings = UserNotificationSettings.createDefault(1L);
      var request =
          new UserNotificationSettingsUpdateRequest(
              null, null, null, null, null, null, null, null, LocalTime.of(0, 0), null, null);

      given(repository.findOrCreateByUserId(1L)).willReturn(settings);
      given(repository.save(any(UserNotificationSettings.class)))
          .willAnswer(inv -> inv.getArgument(0));

      // when
      var result = service.updateSettings(1L, request);

      // then
      assertThat(result.getPushDailyTaskTime()).isEqualTo(LocalTime.of(0, 0));
    }

    @Test
    @DisplayName("성공: pushDailyTaskTime 23:59")
    void pushDailyTaskTimeEndOfDay() {
      // given
      var settings = UserNotificationSettings.createDefault(1L);
      var request =
          new UserNotificationSettingsUpdateRequest(
              null, null, null, null, null, null, null, null, LocalTime.of(23, 59), null, null);

      given(repository.findOrCreateByUserId(1L)).willReturn(settings);
      given(repository.save(any(UserNotificationSettings.class)))
          .willAnswer(inv -> inv.getArgument(0));

      // when
      var result = service.updateSettings(1L, request);

      // then
      assertThat(result.getPushDailyTaskTime()).isEqualTo(LocalTime.of(23, 59));
    }
  }

  @Nested
  @DisplayName("기본 설정 생성")
  class CreateDefaultSettings {

    @Test
    @DisplayName("성공: 신규 사용자 기본 알림 설정 생성")
    void defaultSettingsCreatedForNewUser() {
      // given
      var defaultSettings = UserNotificationSettings.createDefault(1L);
      given(repository.findOrCreateByUserId(1L)).willReturn(defaultSettings);

      // when
      var result = service.createDefaultSettings(1L);

      // then
      assertThat(result.getUserId()).isEqualTo(1L);
      assertThat(result.isPushEnabled()).isTrue();
      verify(repository).findOrCreateByUserId(1L);
    }
  }
}
