package io.github.beom.auth.login;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 로그인 Command (CQRS)
 */
@Getter
@RequiredArgsConstructor
public class LoginCommand {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private final String email;

    @NotBlank(message = "Password is required")
    private final String password;
}
