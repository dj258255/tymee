package io.github.beom.user.createuser;

import io.github.beom.user.domain.User;
import io.github.beom.user.domain.UserStatus;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 사용자 생성 응답 DTO
 */
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