package io.github.beom.auth.refresh;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Refresh Token 응답 DTO
 */
@Getter
@AllArgsConstructor
public class RefreshTokenResponse {
    private String message;
    private String accessToken;  // 모바일용
    private Long expiresIn;      // 모바일용

    public static RefreshTokenResponse forWeb() {
        return new RefreshTokenResponse(
            "Token refreshed successfully",
            null,  // 웹은 Cookie로 전달
            null
        );
    }

    public static RefreshTokenResponse forMobile(String accessToken, long expiresIn) {
        return new RefreshTokenResponse(
            "Token refreshed successfully",
            accessToken,
            expiresIn
        );
    }
}
