package io.github.beom.auth.kakao;

import io.github.beom.user.domain.User;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 카카오 로그인 응답 DTO
 */
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class KakaoLoginResponse {
    private Long id;
    private String email;
    private String name;
    private String accessToken;
    private String refreshToken;
    private Long expiresIn;

    public static KakaoLoginResponse of(User user, String accessToken, String refreshToken, Long expiresIn) {
        return new KakaoLoginResponse(
            user.getId(),
            user.getEmail(),
            user.getName(),
            accessToken,
            refreshToken,
            expiresIn
        );
    }

    public static KakaoLoginResponse ofWeb(User user) {
        return new KakaoLoginResponse(
            user.getId(),
            user.getEmail(),
            user.getName(),
            null,
            null,
            null
        );
    }
}