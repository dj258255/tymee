package io.github.beom.auth.login;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 로그인 REST Controller
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class LoginController {

    private final LoginHandler handler;

    @PostMapping("/login")
    public LoginResponse login(
        @Valid @RequestBody LoginCommand command,
        HttpServletRequest request,
        HttpServletResponse response
    ) {
        return handler.handle(command, request, response);
    }
}
