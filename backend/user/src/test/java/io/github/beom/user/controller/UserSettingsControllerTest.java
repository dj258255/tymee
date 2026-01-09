package io.github.beom.user.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import io.github.beom.core.security.UserPrincipal;
import io.github.beom.user.domain.UserSettings;
import io.github.beom.user.dto.UserSettingsResponse;
import io.github.beom.user.dto.UserSettingsUpdateRequest;
import io.github.beom.user.mapper.UserSettingsMapper;
import io.github.beom.user.service.UserSettingsService;
import java.time.LocalTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserSettingsController 테스트")
class UserSettingsControllerTest {

  @Mock private UserSettingsService userSettingsService;
  @Mock private UserSettingsMapper userSettingsMapper;

  @InjectMocks private UserSettingsController controller;

  private UserSettings defaultSettings;
  private UserSettingsResponse defaultResponse;
  private UserPrincipal ownerPrincipal;
  private UserPrincipal otherPrincipal;

  @BeforeEach
  void setUp() {
    defaultSettings = UserSettings.createDefault(1L);
    defaultResponse =
        new UserSettingsResponse(
            "SYSTEM",
            "KO",
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            LocalTime.of(8, 0),
            true,
            10,
            true,
            true,
            true,
            6,
            180,
            1260,
            false);
    ownerPrincipal = new UserPrincipal(1L, "owner@example.com", "ROLE_USER");
    otherPrincipal = new UserPrincipal(2L, "other@example.com", "ROLE_USER");
  }

  @Nested
  @DisplayName("GET /users/{userId}/settings")
  class GetSettings {

    @Test
    @DisplayName("성공: 본인 설정 조회")
    void ownSettingsReturned() {
      // given
      given(userSettingsService.getSettings(1L)).willReturn(defaultSettings);
      given(userSettingsMapper.toResponse(defaultSettings)).willReturn(defaultResponse);

      // when
      var response = controller.getSettings(1L, ownerPrincipal);

      // then
      assertThat(response.isSuccess()).isTrue();
      assertThat(response.getData().themeMode()).isEqualTo("SYSTEM");
      assertThat(response.getData().language()).isEqualTo("KO");
    }

    @Test
    @DisplayName("실패: 타인 설정 조회 시 AccessDeniedException")
    void otherUserSettingsThrowsException() {
      // when & then
      assertThatThrownBy(() -> controller.getSettings(1L, otherPrincipal))
          .isInstanceOf(AccessDeniedException.class)
          .hasMessageContaining("본인의 설정만");

      verify(userSettingsService, never()).getSettings(any());
    }
  }

  @Nested
  @DisplayName("PATCH /users/{userId}/settings")
  class UpdateSettings {

    @Test
    @DisplayName("성공: 테마 모드 변경")
    void themeModeUpdated() {
      // given
      var request =
          new UserSettingsUpdateRequest(
              "DARK", null, null, null, null, null, null, null, null, null, null, null, null, null,
              null, null, null, null, null, null);
      var updatedResponse =
          new UserSettingsResponse(
              "DARK",
              "KO",
              true,
              true,
              true,
              true,
              true,
              true,
              true,
              true,
              LocalTime.of(8, 0),
              true,
              10,
              true,
              true,
              true,
              6,
              180,
              1260,
              false);

      given(userSettingsService.updateSettings(eq(1L), any(UserSettingsUpdateRequest.class)))
          .willReturn(defaultSettings);
      given(userSettingsMapper.toResponse(any())).willReturn(updatedResponse);

      // when
      var response = controller.updateSettings(1L, ownerPrincipal, request);

      // then
      assertThat(response.isSuccess()).isTrue();
      assertThat(response.getData().themeMode()).isEqualTo("DARK");
    }

    @Test
    @DisplayName("성공: 언어 변경")
    void languageUpdated() {
      // given
      var request =
          new UserSettingsUpdateRequest(
              null, "EN", null, null, null, null, null, null, null, null, null, null, null, null,
              null, null, null, null, null, null);
      var updatedResponse =
          new UserSettingsResponse(
              "SYSTEM",
              "EN",
              true,
              true,
              true,
              true,
              true,
              true,
              true,
              true,
              LocalTime.of(8, 0),
              true,
              10,
              true,
              true,
              true,
              6,
              180,
              1260,
              false);

      given(userSettingsService.updateSettings(eq(1L), any(UserSettingsUpdateRequest.class)))
          .willReturn(defaultSettings);
      given(userSettingsMapper.toResponse(any())).willReturn(updatedResponse);

      // when
      var response = controller.updateSettings(1L, ownerPrincipal, request);

      // then
      assertThat(response.isSuccess()).isTrue();
      assertThat(response.getData().language()).isEqualTo("EN");
    }

    @Test
    @DisplayName("성공: 플래너 시작 시간 변경")
    void plannerStartHourUpdated() {
      // given
      var request =
          new UserSettingsUpdateRequest(
              null, null, null, null, null, null, null, null, null, null, null, null, null, null,
              null, null, 9, null, null, null);
      var updatedResponse =
          new UserSettingsResponse(
              "SYSTEM",
              "KO",
              true,
              true,
              true,
              true,
              true,
              true,
              true,
              true,
              LocalTime.of(8, 0),
              true,
              10,
              true,
              true,
              true,
              9,
              180,
              1260,
              false);

      given(userSettingsService.updateSettings(eq(1L), any(UserSettingsUpdateRequest.class)))
          .willReturn(defaultSettings);
      given(userSettingsMapper.toResponse(any())).willReturn(updatedResponse);

      // when
      var response = controller.updateSettings(1L, ownerPrincipal, request);

      // then
      assertThat(response.isSuccess()).isTrue();
      assertThat(response.getData().plannerStartHour()).isEqualTo(9);
    }

    @Test
    @DisplayName("성공: 푸시 알림 전체 off")
    void pushDisabled() {
      // given
      var request =
          new UserSettingsUpdateRequest(
              null, null, false, null, null, null, null, null, null, null, null, null, null, null,
              null, null, null, null, null, null);
      var updatedResponse =
          new UserSettingsResponse(
              "SYSTEM",
              "KO",
              false,
              true,
              true,
              true,
              true,
              true,
              true,
              true,
              LocalTime.of(8, 0),
              true,
              10,
              true,
              true,
              true,
              6,
              180,
              1260,
              false);

      given(userSettingsService.updateSettings(eq(1L), any(UserSettingsUpdateRequest.class)))
          .willReturn(defaultSettings);
      given(userSettingsMapper.toResponse(any())).willReturn(updatedResponse);

      // when
      var response = controller.updateSettings(1L, ownerPrincipal, request);

      // then
      assertThat(response.isSuccess()).isTrue();
      assertThat(response.getData().pushEnabled()).isFalse();
    }

    @Test
    @DisplayName("성공: 개인정보 공개 설정 모두 off")
    void privacySettingsUpdated() {
      // given
      var request =
          new UserSettingsUpdateRequest(
              null, null, null, null, null, null, null, null, null, null, null, null, null, false,
              false, false, null, null, null, null);
      var updatedResponse =
          new UserSettingsResponse(
              "SYSTEM",
              "KO",
              true,
              true,
              true,
              true,
              true,
              true,
              true,
              true,
              LocalTime.of(8, 0),
              true,
              10,
              false,
              false,
              false,
              6,
              180,
              1260,
              false);

      given(userSettingsService.updateSettings(eq(1L), any(UserSettingsUpdateRequest.class)))
          .willReturn(defaultSettings);
      given(userSettingsMapper.toResponse(any())).willReturn(updatedResponse);

      // when
      var response = controller.updateSettings(1L, ownerPrincipal, request);

      // then
      assertThat(response.isSuccess()).isTrue();
      assertThat(response.getData().privacyProfilePublic()).isFalse();
      assertThat(response.getData().privacyStudyPublic()).isFalse();
      assertThat(response.getData().privacyAllowFriendRequest()).isFalse();
    }

    @Test
    @DisplayName("실패: 타인 설정 수정 시 AccessDeniedException")
    void otherUserSettingsUpdateThrowsException() {
      // given
      var request =
          new UserSettingsUpdateRequest(
              "DARK", null, null, null, null, null, null, null, null, null, null, null, null, null,
              null, null, null, null, null, null);

      // when & then
      assertThatThrownBy(() -> controller.updateSettings(1L, otherPrincipal, request))
          .isInstanceOf(AccessDeniedException.class)
          .hasMessageContaining("본인의 설정만");

      verify(userSettingsService, never()).updateSettings(any(), any());
    }

    @Test
    @DisplayName("성공: 빈 요청 (아무것도 변경 안함)")
    void emptyRequestDoesNothing() {
      // given
      var request =
          new UserSettingsUpdateRequest(
              null, null, null, null, null, null, null, null, null, null, null, null, null, null,
              null, null, null, null, null, null);

      given(userSettingsService.updateSettings(eq(1L), any(UserSettingsUpdateRequest.class)))
          .willReturn(defaultSettings);
      given(userSettingsMapper.toResponse(any())).willReturn(defaultResponse);

      // when
      var response = controller.updateSettings(1L, ownerPrincipal, request);

      // then
      assertThat(response.isSuccess()).isTrue();
      verify(userSettingsService).updateSettings(1L, request);
    }
  }
}
