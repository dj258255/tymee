package io.github.beom.user.getuser;

import io.github.beom.user.domain.User;
import io.github.beom.user.domain.UserStatus;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 사용자 조회 응답 DTO
 */
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