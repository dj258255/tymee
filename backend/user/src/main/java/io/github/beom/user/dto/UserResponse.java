package io.github.beom.user.dto;

import java.time.LocalDateTime;
import lombok.Builder;

/** 사용자 정보 응답 DTO. */
@Builder
public record UserResponse(
    Long id,
    String email,
    String nickname,
    Long profileImageId,
    String bio,
    Integer level,
    String tier,
    Long totalStudyMinutes,
    String status,
    String role,
    LocalDateTime lastLoginAt,
    LocalDateTime lastActiveAt,
    LocalDateTime createdAt) {}
