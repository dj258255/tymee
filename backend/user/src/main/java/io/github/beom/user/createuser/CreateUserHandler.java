package io.github.beom.user.createuser;

import io.github.beom.common.exception.BusinessException;
import io.github.beom.common.exception.ErrorCode;
import io.github.beom.user.domain.User;
import io.github.beom.user.domain.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 사용자 생성 유스케이스 핸들러 (Clean Architecture + Vertical Slice)
 * 각 Vertical Slice는 독립적인 핸들러를 가집니다
 */
@Service
@RequiredArgsConstructor
public class CreateUserHandler {
    private final UserRepository userRepository;

    @Transactional
    public CreateUserResponse handle(CreateUserCommand command) {
        // 비즈니스 규칙: 이메일은 유일해야 함
        if (userRepository.existsByEmail(command.getEmail())) {
            throw new BusinessException(
                ErrorCode.INVALID_INPUT_VALUE,
                "이미 존재하는 이메일입니다"
            );
        }

        // 도메인 엔티티 생성 (비밀번호는 이미 암호화된 상태여야 함)
        User user = User.create(command.getEmail(), command.getPassword(), command.getName());

        // 리포지토리 포트를 통해 저장
        User savedUser = userRepository.save(user);

        // 응답 반환
        return CreateUserResponse.from(savedUser);
    }
}