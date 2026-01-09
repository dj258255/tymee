package io.github.beom.user.dto;

import io.github.beom.user.domain.vo.Nickname;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
    @NotBlank(message = "닉네임은 필수입니다") @Size(min = 1, max = 30, message = "닉네임은 30바이트 이하여야 합니다")
        String nickname,
    @Size(max = 100, message = "자기소개는 100자 이하여야 합니다") String bio) {

  /** 닉네임 바이트 길이 검증 */
  public void validateNicknameBytes() {
    int byteLength = Nickname.getByteLength(nickname);
    if (byteLength > Nickname.maxBytes()) {
      throw new IllegalArgumentException(
          String.format("닉네임은 %d바이트 이하여야 합니다 (현재: %d바이트)", Nickname.maxBytes(), byteLength));
    }
  }
}
