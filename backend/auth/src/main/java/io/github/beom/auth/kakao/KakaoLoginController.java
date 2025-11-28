package io.github.beom.auth.kakao;

import io.github.beom.auth.jwt.CookieUtil;
import io.github.beom.auth.jwt.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.web.bind.annotation.*;

/**
 * 카카오 로그인 REST Controller
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class KakaoLoginController {
    private static final Logger log = LogManager.getLogger(KakaoLoginController.class);

    private final KakaoLoginHandler handler;
    private final CookieUtil cookieUtil;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * 카카오 로그인 엔드포인트
     * - 웹: HttpOnly Cookie로 토큰 저장
     * - 모바일: JSON Body로 토큰 반환
     */
    @PostMapping("/kakao/login")
    public KakaoLoginResponse kakaoLogin(
        @Valid @RequestBody KakaoLoginCommand command,
        HttpServletRequest request,
        HttpServletResponse response
    ) {
        // 카카오 로그인 처리
        KakaoLoginResponse loginResponse = handler.handle(command);

        // 클라이언트 타입 판별 (웹 or 모바일)
        String clientType = request.getHeader("X-Client-Type");
        boolean isMobile = "mobile".equalsIgnoreCase(clientType);

        if (isMobile) {
            // 모바일: JSON Body로 토큰 반환
            log.debug("Mobile Kakao login completed");
            return loginResponse;
        } else {
            // 웹: HttpOnly Cookie로 토큰 설정
            log.debug("Web Kakao login completed");
            cookieUtil.createAccessTokenCookie(
                response,
                loginResponse.getAccessToken(),
                jwtTokenProvider.getAccessTokenExpirationInSeconds()
            );
            cookieUtil.createRefreshTokenCookie(
                response,
                loginResponse.getRefreshToken(),
                jwtTokenProvider.getRefreshTokenExpirationInSeconds()
            );

            return KakaoLoginResponse.ofWeb(
                io.github.beom.user.domain.User.reconstruct(
                    loginResponse.getId(),
                    loginResponse.getEmail(),
                    null,
                    loginResponse.getName(),
                    io.github.beom.user.domain.UserStatus.ACTIVE
                )
            );
        }
    }
}