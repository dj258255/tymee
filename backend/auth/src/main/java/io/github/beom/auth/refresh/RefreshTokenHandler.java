package io.github.beom.auth.refresh;

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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Refresh Token Use Case Handler
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenHandler {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final CookieUtil cookieUtil;

    @Transactional(readOnly = true)
    public RefreshTokenResponse handle(
        HttpServletRequest request,
        HttpServletResponse response
    ) {
        // 1. Refresh Token 추출 (Cookie 또는 Header)
        String refreshToken = extractRefreshToken(request);

        if (refreshToken == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "Refresh token not found");
        }

        // 2. Refresh Token 검증
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "Invalid refresh token");
        }

        // 3. userId 추출
        Long userId = jwtTokenProvider.getUserIdFromToken(refreshToken);

        // 4. 사용자 조회
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND, "User not found"));

        // 5. 계정 상태 확인
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Account is not active");
        }

        // 6. 새로운 Access Token 생성
        String newAccessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getEmail());

        // 7. 클라이언트 타입 판별 (웹 or 모바일)
        String clientType = request.getHeader("X-Client-Type");
        boolean isMobile = "mobile".equalsIgnoreCase(clientType);

        if (isMobile) {
            // 모바일: JSON Body로 토큰 반환
            log.debug("Mobile token refresh: {}", user.getEmail());
            return RefreshTokenResponse.forMobile(
                newAccessToken,
                jwtTokenProvider.getAccessTokenExpirationInSeconds()
            );
        } else {
            // 웹: HttpOnly Cookie로 토큰 설정
            log.debug("Web token refresh: {}", user.getEmail());
            cookieUtil.createAccessTokenCookie(
                response,
                newAccessToken,
                jwtTokenProvider.getAccessTokenExpirationInSeconds()
            );

            return RefreshTokenResponse.forWeb();
        }
    }

    /**
     * Refresh Token 추출 (Cookie > Authorization Header 순서)
     */
    private String extractRefreshToken(HttpServletRequest request) {
        // 1. Cookie에서 Refresh Token 추출 (웹)
        String tokenFromCookie = cookieUtil.getRefreshTokenFromCookie(request).orElse(null);
        if (tokenFromCookie != null) {
            log.debug("Refresh token from cookie");
            return tokenFromCookie;
        }

        // 2. Authorization Header에서 Refresh Token 추출 (모바일)
        String bearerToken = request.getHeader("X-Refresh-Token");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            log.debug("Refresh token from X-Refresh-Token header");
            return bearerToken.substring(7);
        }

        return null;
    }
}
