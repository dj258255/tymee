package io.github.beom.auth.logout;

import io.github.beom.auth.jwt.CookieUtil;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 로그아웃 REST Controller
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class LogoutController {

    private final CookieUtil cookieUtil;

    @PostMapping("/logout")
    public Map<String, String> logout(HttpServletResponse response) {
        // 쿠키 삭제 (웹용)
        cookieUtil.deleteTokenCookies(response);

        return Map.of("message", "Logged out successfully");
    }
}
