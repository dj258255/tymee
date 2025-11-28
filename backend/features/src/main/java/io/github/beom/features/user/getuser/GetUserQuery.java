package io.github.beom.features.user.getuser;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Query for getting a user (CQRS pattern)
 */
@Getter
@RequiredArgsConstructor
public class GetUserQuery {
    private final Long userId;
}
