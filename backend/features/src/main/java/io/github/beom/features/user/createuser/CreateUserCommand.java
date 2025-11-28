package io.github.beom.features.user.createuser;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Command for creating a user (CQRS pattern)
 */
@Getter
@RequiredArgsConstructor
public class CreateUserCommand {
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private final String email;

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name is too long")
    private final String name;
}
