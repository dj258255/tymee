package io.github.beom.auth.signup;

import io.github.beom.user.domain.User;
import io.github.beom.user.domain.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 회원가입 응답 DTO
 */
@Getter
@AllArgsConstructor
public class SignupResponse {
    private Long id;
    private String email;
    private String name;
    private UserStatus status;

    // 모바일용 (토큰 포함)
    private String accessToken;
    private String refreshToken;
    private Long expiresIn;

    public static SignupResponse forWeb(User user) {
        return new SignupResponse(
            user.getId(),
            user.getEmail(),
            user.getName(),
            user.getStatus(),
            null,  // 웹은 Cookie로 전달
            null,
            null
        );
    }

    public static SignupResponse forMobile(User user, String accessToken, String refreshToken, long expiresIn) {
        return new SignupResponse(
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
