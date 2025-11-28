package io.github.beom.user.createuser;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * 사용자 생성 REST 컨트롤러
 * 각 Vertical Slice는 독립적인 컨트롤러를 가집니다
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