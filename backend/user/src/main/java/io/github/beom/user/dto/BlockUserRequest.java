package io.github.beom.user.dto;

/**
 * 사용자 차단 요청 DTO.
 *
 * @param reason 차단 사유 (선택)
 */
public record BlockUserRequest(String reason) {}
