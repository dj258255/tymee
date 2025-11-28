package io.github.beom.features.user.getuser;

import io.github.beom.common.exception.BusinessException;
import io.github.beom.common.exception.ErrorCode;
import io.github.beom.features.user.User;
import io.github.beom.features.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Query handler for getting a user (CQRS + Vertical Slice)
 */
@Service
@RequiredArgsConstructor
public class GetUserHandler {
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public GetUserResponse handle(GetUserQuery query) {
        User user = userRepository.findById(query.getUserId())
            .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND, "User not found"));

        return GetUserResponse.from(user);
    }
}
