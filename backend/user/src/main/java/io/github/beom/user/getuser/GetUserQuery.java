package io.github.beom.user.getuser;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 사용자 조회 쿼리 (CQRS 패턴)
 */
@Getter
@RequiredArgsConstructor
public class GetUserQuery {
    private final Long userId;
}