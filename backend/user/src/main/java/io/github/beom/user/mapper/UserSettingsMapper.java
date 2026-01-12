package io.github.beom.user.mapper;

import io.github.beom.user.domain.UserSettings;
import io.github.beom.user.domain.vo.Language;
import io.github.beom.user.domain.vo.ThemeMode;
import io.github.beom.user.dto.UserSettingsResponse;
import io.github.beom.user.dto.UserSettingsUpdateRequest;
import io.github.beom.user.entity.UserSettingsEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

/**
 * UserSettings 매퍼 (알림 설정 제외).
 *
 * <p>Domain ↔ Entity ↔ DTO 변환을 담당한다.
 */
@Mapper(componentModel = "spring")
public interface UserSettingsMapper {

  /** Domain → Response DTO 변환. */
  @Mapping(target = "themeMode", expression = "java(settings.getThemeMode().name())")
  @Mapping(target = "language", expression = "java(settings.getLanguage().name())")
  UserSettingsResponse toResponse(UserSettings settings);

  /** Domain → Entity 변환. */
  @Mapping(target = "language", source = "language", qualifiedByName = "languageToString")
  UserSettingsEntity toEntity(UserSettings settings);

  /** Entity → Domain 변환. */
  @Mapping(target = "language", source = "language", qualifiedByName = "stringToLanguage")
  UserSettings toDomain(UserSettingsEntity entity);

  @Named("languageToString")
  default String languageToString(Language language) {
    return language != null ? language.name() : null;
  }

  /**
   * Request DTO → Domain 부분 업데이트.
   *
   * <p>DDD 원칙에 따라 Domain의 update 메서드를 통해 변경한다. null인 필드는 무시하고 기존 값 유지.
   */
  default void updateFromRequest(UserSettingsUpdateRequest request, UserSettings settings) {
    // 앱 설정
    if (request.themeMode() != null) {
      settings.updateThemeMode(ThemeMode.valueOf(request.themeMode().toUpperCase()));
    }
    if (request.language() != null) {
      settings.updateLanguage(Language.valueOf(request.language().toUpperCase()));
    }

    // 개인정보 설정
    if (hasPrivacySettingsUpdate(request)) {
      settings.updatePrivacySettings(
          getOrDefault(request.privacyProfilePublic(), settings.isPrivacyProfilePublic()),
          getOrDefault(request.privacyStudyPublic(), settings.isPrivacyStudyPublic()),
          getOrDefault(
              request.privacyAllowFriendRequest(), settings.isPrivacyAllowFriendRequest()));
    }

    // 플래너 설정
    if (hasPlannerSettingsUpdate(request)) {
      settings.updatePlannerSettings(
          getOrDefault(request.plannerStartHour(), settings.getPlannerStartHour()),
          getOrDefault(request.dailyGoalMinutes(), settings.getDailyGoalMinutes()),
          getOrDefault(request.weeklyGoalMinutes(), settings.getWeeklyGoalMinutes()),
          getOrDefault(request.weeklyTimetableEnabled(), settings.isWeeklyTimetableEnabled()));
    }
  }

  private static boolean hasPrivacySettingsUpdate(UserSettingsUpdateRequest request) {
    return request.privacyProfilePublic() != null
        || request.privacyStudyPublic() != null
        || request.privacyAllowFriendRequest() != null;
  }

  private static boolean hasPlannerSettingsUpdate(UserSettingsUpdateRequest request) {
    return request.plannerStartHour() != null
        || request.dailyGoalMinutes() != null
        || request.weeklyGoalMinutes() != null
        || request.weeklyTimetableEnabled() != null;
  }

  private static <T> T getOrDefault(T value, T defaultValue) {
    return value != null ? value : defaultValue;
  }

  @Named("stringToLanguage")
  default Language stringToLanguage(String value) {
    return value != null ? Language.valueOf(value.toUpperCase()) : null;
  }
}
