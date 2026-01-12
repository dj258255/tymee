package io.github.beom.user.mapper;

import io.github.beom.user.domain.User;
import io.github.beom.user.dto.UserProfileResponse;
import io.github.beom.user.dto.UserResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * User 매퍼.
 *
 * <p>User Domain → DTO 변환을 담당한다.
 */
@Mapper(componentModel = "spring")
public interface UserMapper {

  /**
   * User → UserResponse 변환.
   *
   * @param user 사용자 도메인
   * @param profileImageUrl 프로필 이미지 URL (FileUrlResolver로 조회)
   */
  @Mapping(
      target = "email",
      expression = "java(user.getEmail() != null ? user.getEmail().value() : null)")
  @Mapping(target = "nickname", expression = "java(user.getDisplayName())")
  @Mapping(target = "profileImageUrl", source = "profileImageUrl")
  @Mapping(target = "tier", expression = "java(user.getTier().name())")
  @Mapping(target = "status", expression = "java(user.getStatus().name())")
  @Mapping(target = "role", expression = "java(user.getRole().name())")
  @Mapping(target = "totalStudyMinutes", expression = "java(user.getTotalStudyMinutes())")
  UserResponse toResponse(User user, String profileImageUrl);

  /** User → UserResponse 변환 (프로필 이미지 URL 없이). */
  default UserResponse toResponse(User user) {
    return toResponse(user, null);
  }

  /** User → UserProfileResponse 변환 (공개 프로필용). */
  @Mapping(target = "nickname", expression = "java(user.getDisplayName())")
  @Mapping(target = "tier", expression = "java(user.getTier().name())")
  @Mapping(target = "totalStudyMinutes", expression = "java(user.getTotalStudyMinutes())")
  UserProfileResponse toProfileResponse(User user);
}
