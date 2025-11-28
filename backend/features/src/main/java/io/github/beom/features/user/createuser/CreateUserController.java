package io.github.beom.features.user.createuser;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for creating a user
 * Each vertical slice has its own controller
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class CreateUserController {
    private final CreateUserHandler handler;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CreateUserResponse createUser(@Valid @RequestBody CreateUserCommand command) {
        return handler.handle(command);
    }
}
