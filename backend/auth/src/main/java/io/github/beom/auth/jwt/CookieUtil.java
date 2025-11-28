package io.github.beom.auth.jwt;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Optional;

/**
 * Cookie 유틸리티 클래스
 * HttpOnly, Secure, SameSite 설정
 */
@Component
public class CookieUtil {

    @Value("${cookie.domain:localhost}")
    private String cookieDomain;

    @Value("${cookie.secure:false}")
    private boolean secure;

    @Value("${cookie.same-site:Lax}")
    private String sameSite;

    private static final String ACCESS_TOKEN_NAME = "accessToken";
    private static final String REFRESH_TOKEN_NAME = "refreshToken";

    /**
     * Access Token 쿠키 생성
     */
    public void createAccessTokenCookie(HttpServletResponse response, String token, long maxAgeSeconds) {
        createCookie(response, ACCESS_TOKEN_NAME, token, maxAgeSeconds);
    }

    /**
     * Refresh Token 쿠키 생성
     */
    public void createRefreshTokenCookie(HttpServletResponse response, String token, long maxAgeSeconds) {
        createCookie(response, REFRESH_TOKEN_NAME, token, maxAgeSeconds);
    }

    /**
     * 쿠키 생성 (HttpOnly, Secure, SameSite 설정)
     */
    private void createCookie(HttpServletResponse response, String name, String value, long maxAgeSeconds) {
        Cookie cookie = new Cookie(name, value);
        cookie.setHttpOnly(true);  // JavaScript 접근 차단 (XSS 방어)
        cookie.setSecure(secure);  // HTTPS only (운영 환경)
        cookie.setPath("/");
        cookie.setMaxAge((int) maxAgeSeconds);
        cookie.setAttribute("SameSite", sameSite);  // CSRF 방어

        response.addCookie(cookie);
    }

    /**
     * Access Token 쿠키에서 값 추출
     */
    public Optional<String> getAccessTokenFromCookie(HttpServletRequest request) {
        return getCookieValue(request, ACCESS_TOKEN_NAME);
    }

    /**
     * Refresh Token 쿠키에서 값 추출
     */
    public Optional<String> getRefreshTokenFromCookie(HttpServletRequest request) {
        return getCookieValue(request, REFRESH_TOKEN_NAME);
    }

    /**
     * 쿠키 값 추출
     */
    private Optional<String> getCookieValue(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return Optional.empty();
        }

        return Arrays.stream(cookies)
            .filter(cookie -> name.equals(cookie.getName()))
            .map(Cookie::getValue)
            .findFirst();
    }

    /**
     * 쿠키 삭제 (로그아웃)
     */
    public void deleteTokenCookies(HttpServletResponse response) {
        deleteCookie(response, ACCESS_TOKEN_NAME);
        deleteCookie(response, REFRESH_TOKEN_NAME);
    }

    /**
     * 쿠키 삭제
     */
    private void deleteCookie(HttpServletResponse response, String name) {
        Cookie cookie = new Cookie(name, null);
        cookie.setHttpOnly(true);
        cookie.setSecure(secure);
        cookie.setPath("/");
        cookie.setMaxAge(0);  // 즉시 삭제
        cookie.setAttribute("SameSite", sameSite);

        response.addCookie(cookie);
    }
}
