package io.github.beom.auth.kakao;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 카카오 로그인 요청 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class KakaoLoginCommand {

    /**
     * 카카오 액세스 토큰 (클라이언트에서 카카오 SDK로 받은 토큰)
     */
    @NotBlank(message = "Kakao access token is required")
    private String accessToken;
}