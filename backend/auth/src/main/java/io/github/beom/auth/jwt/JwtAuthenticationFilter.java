package io.github.beom.auth.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;

/**
 * JWT 인증 필터
 * - Cookie 또는 Authorization Header에서 토큰 추출
 * - 웹: HttpOnly Cookie
 * - 모바일: Authorization: Bearer {token}
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final CookieUtil cookieUtil;

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {

        try {
            // 1. 토큰 추출 (Cookie 또는 Header)
            String jwt = extractToken(request);

            // 2. 토큰 검증
            if (jwt != null && jwtTokenProvider.validateToken(jwt)) {
                // 3. userId 추출
                Long userId = jwtTokenProvider.getUserIdFromToken(jwt);

                // 4. Spring Security Context에 인증 정보 설정
                UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                        userId,
                        null,
                        new ArrayList<>()  // 권한 (나중에 Role 추가 가능)
                    );

                authentication.setDetails(
                    new WebAuthenticationDetailsSource().buildDetails(request)
                );

                SecurityContextHolder.getContext().setAuthentication(authentication);

                log.debug("Authenticated user: {}", userId);
            }
        } catch (Exception e) {
            log.error("Could not set user authentication: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    /**
     * 토큰 추출 (Cookie > Authorization Header 순서)
     */
    private String extractToken(HttpServletRequest request) {
        // 1. Cookie에서 토큰 추출 (웹)
        String tokenFromCookie = cookieUtil.getAccessTokenFromCookie(request).orElse(null);
        if (tokenFromCookie != null) {
            log.debug("Token from cookie");
            return tokenFromCookie;
        }

        // 2. Authorization Header에서 토큰 추출 (모바일)
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            log.debug("Token from Authorization header");
            return bearerToken.substring(7);
        }

        return null;
    }
}
