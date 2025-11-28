package io.github.beom.auth.login;

import io.github.beom.user.domain.User;
import io.github.beom.user.domain.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 로그인 응답 DTO
 */
@Getter
@AllArgsConstructor
public class LoginResponse {
    private Long id;
    private String email;
    private String name;
    private UserStatus status;

    // 모바일용 (토큰 포함)
    private String accessToken;
    private String refreshToken;
    private Long expiresIn;

    public static LoginResponse forWeb(User user) {
        return new LoginResponse(
            user.getId(),
            user.getEmail(),
            user.getName(),
            user.getStatus(),
            null,  // 웹은 Cookie로 전달
            null,
            null
        );
    }

    public static LoginResponse forMobile(User user, String accessToken, String refreshToken, long expiresIn) {
        return new LoginResponse(
            user.getId(),
            user.getEmail(),
            user.getName(),
            user.getStatus(),
            accessToken,
            refreshToken,
            expiresIn
        );
    }
}
