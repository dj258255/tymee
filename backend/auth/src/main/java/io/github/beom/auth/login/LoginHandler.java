package io.github.beom.auth.login;

import io.github.beom.common.exception.BusinessException;
import io.github.beom.common.exception.ErrorCode;
import io.github.beom.auth.jwt.CookieUtil;
import io.github.beom.auth.jwt.JwtTokenProvider;
import io.github.beom.user.domain.User;
import io.github.beom.user.domain.UserRepository;
import io.github.beom.user.domain.UserStatus;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 로그인 Use Case Handler
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LoginHandler {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final CookieUtil cookieUtil;

    @Transactional(readOnly = true)
    public LoginResponse handle(
        LoginCommand command,
        HttpServletRequest request,
        HttpServletResponse response
    ) {
        // 1. 사용자 조회
        User user = userRepository.findByEmail(command.getEmail())
            .orElseThrow(() -> new BusinessException(
                ErrorCode.UNAUTHORIZED,
                "Invalid email or password"
            ));

        // 2. 비밀번호 검증
        if (!passwordEncoder.matches(command.getPassword(), user.getPassword())) {
            throw new BusinessException(
                ErrorCode.UNAUTHORIZED,
                "Invalid email or password"
            );
        }

        // 3. 계정 상태 확인
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessException(
                ErrorCode.FORBIDDEN,
                "Account is not active"
            );
        }

        // 4. JWT 토큰 생성
        String accessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getEmail());
        String refreshToken = jwtTokenProvider.createRefreshToken(user.getId());

        // 5. 클라이언트 타입 판별 (웹 or 모바일)
        String clientType = request.getHeader("X-Client-Type");
        boolean isMobile = "mobile".equalsIgnoreCase(clientType);

        if (isMobile) {
            // 모바일: JSON Body로 토큰 반환
            log.debug("Mobile login: {}", user.getEmail());
            return LoginResponse.forMobile(
                user,
                accessToken,
                refreshToken,
                jwtTokenProvider.getAccessTokenExpirationInSeconds()
            );
        } else {
            // 웹: HttpOnly Cookie로 토큰 설정
            log.debug("Web login: {}", user.getEmail());
            cookieUtil.createAccessTokenCookie(
                response,
                accessToken,
                jwtTokenProvider.getAccessTokenExpirationInSeconds()
            );
            cookieUtil.createRefreshTokenCookie(
                response,
                refreshToken,
                jwtTokenProvider.getRefreshTokenExpirationInSeconds()
            );

            return LoginResponse.forWeb(user);
        }
    }
}
