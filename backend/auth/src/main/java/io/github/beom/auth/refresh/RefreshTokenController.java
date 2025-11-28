package io.github.beom.auth.refresh;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * Refresh Token REST Controller
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class RefreshTokenController {

    private final RefreshTokenHandler handler;

    @PostMapping("/refresh")
    public RefreshTokenResponse refresh(
        HttpServletRequest request,
        HttpServletResponse response
    ) {
        return handler.handle(request, response);
    }
}
