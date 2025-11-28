package io.github.beom.features.user.getuser;

import io.github.beom.features.user.User;
import io.github.beom.features.user.UserStatus;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class GetUserResponse {
    private final Long id;
    private final String email;
    private final String name;
    private final UserStatus status;

    public static GetUserResponse from(User user) {
        return new GetUserResponse(
            user.getId(),
            user.getEmail(),
            user.getName(),
            user.getStatus()
        );
    }
}
