package io.github.beom.features.user.getuser;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for getting a user
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class GetUserController {
    private final GetUserHandler handler;

    @GetMapping("/{id}")
    public GetUserResponse getUser(@PathVariable Long id) {
        return handler.handle(new GetUserQuery(id));
    }
}
