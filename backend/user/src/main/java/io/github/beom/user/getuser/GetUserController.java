package io.github.beom.user.getuser;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 사용자 조회 REST 컨트롤러
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