package io.github.beom.user.dto;

import lombok.Builder;

/** 사용자 공개 프로필 응답 DTO. */
@Builder
public record UserProfileResponse(
    Long id,
    String nickname,
    Long profileImageId,
    String bio,
    Integer level,
    String tier,
    Long totalStudyMinutes) {}
