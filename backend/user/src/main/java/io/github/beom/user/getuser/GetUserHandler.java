package io.github.beom.user.getuser;

import io.github.beom.common.exception.BusinessException;
import io.github.beom.common.exception.ErrorCode;
import io.github.beom.user.domain.User;
import io.github.beom.user.domain.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 사용자 조회 쿼리 핸들러 (CQRS + Vertical Slice)
 */
@Service
@RequiredArgsConstructor
public class GetUserHandler {
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public GetUserResponse handle(GetUserQuery query) {
        User user = userRepository.findById(query.getUserId())
            .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND, "사용자를 찾을 수 없습니다"));

        return GetUserResponse.from(user);
    }
}