package io.github.beom.auth.signup;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * 회원가입 REST Controller
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class SignupController {

    private final SignupHandler handler;

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public SignupResponse signup(
        @Valid @RequestBody SignupCommand command,
        HttpServletRequest request,
        HttpServletResponse response
    ) {
        return handler.handle(command, request, response);
    }
}
