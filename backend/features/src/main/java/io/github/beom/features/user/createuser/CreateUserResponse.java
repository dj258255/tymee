package io.github.beom.features.user.createuser;

import io.github.beom.features.user.User;
import io.github.beom.features.user.UserStatus;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class CreateUserResponse {
    private final Long id;
    private final String email;
    private final String name;
    private final UserStatus status;

    public static CreateUserResponse from(User user) {
        return new CreateUserResponse(
            user.getId(),
            user.getEmail(),
            user.getName(),
            user.getStatus()
        );
    }
}
