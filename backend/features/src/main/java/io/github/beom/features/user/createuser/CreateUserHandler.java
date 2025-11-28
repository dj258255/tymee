package io.github.beom.features.user.createuser;

import io.github.beom.common.exception.BusinessException;
import io.github.beom.common.exception.ErrorCode;
import io.github.beom.features.user.User;
import io.github.beom.features.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Use case handler for creating a user (Clean Architecture + Vertical Slice)
 * Each vertical slice contains its own handler
 */
@Service
@RequiredArgsConstructor
public class CreateUserHandler {
    private final UserRepository userRepository;

    @Transactional
    public CreateUserResponse handle(CreateUserCommand command) {
        // Business rule: email must be unique
        if (userRepository.existsByEmail(command.getEmail())) {
            throw new BusinessException(
                ErrorCode.INVALID_INPUT_VALUE,
                "Email already exists"
            );
        }

        // Create domain entity
        User user = User.create(command.getEmail(), command.getName());

        // Save through repository port
        User savedUser = userRepository.save(user);

        // Return response
        return CreateUserResponse.from(savedUser);
    }
}
