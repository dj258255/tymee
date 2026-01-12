package io.github.beom.user.dto;

import io.github.beom.user.domain.vo.Nickname;
import jakarta.validation.constraints.Size;

/**
 * 프로필 업데이트 요청 DTO. PATCH 요청이므로 모든 필드는 optional이며, null이 아닌 필드만 업데이트됨.
 *
 * @param nickname 닉네임 (1~30바이트)
 * @param bio 자기소개 (최대 100자)
 * @param profileImageId 프로필 이미지 ID (Upload 테이블의 스노우플레이크 PK)
 */
public record UpdateProfileRequest(
    @Size(max = 30, message = "닉네임은 30바이트 이하여야 합니다") String nickname,
    @Size(max = 100, message = "자기소개는 100자 이하여야 합니다") String bio,
    Long profileImageId) {

  /** 닉네임 바이트 길이 검증 (닉네임이 있을 경우에만) */
  public void validateNicknameBytes() {
    if (nickname == null || nickname.isBlank()) {
      return;
    }
    int byteLength = Nickname.getByteLength(nickname);
    if (byteLength > Nickname.maxBytes()) {
      throw new IllegalArgumentException(
          String.format("닉네임은 %d바이트 이하여야 합니다 (현재: %d바이트)", Nickname.maxBytes(), byteLength));
    }
  }
}
