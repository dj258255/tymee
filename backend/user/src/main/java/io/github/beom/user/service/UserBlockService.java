package io.github.beom.user.service;

import io.github.beom.core.exception.BusinessException;
import io.github.beom.core.exception.EntityNotFoundException;
import io.github.beom.core.exception.ErrorCode;
import io.github.beom.user.domain.User;
import io.github.beom.user.domain.UserBlock;
import io.github.beom.user.dto.BlockedUserResponse;
import io.github.beom.user.repository.UserBlockRepository;
import io.github.beom.user.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 사용자 차단 관련 비즈니스 로직을 처리하는 서비스. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserBlockService {

  private final UserBlockRepository userBlockRepository;
  private final UserRepository userRepository;

  /**
   * 사용자를 차단한다.
   *
   * <p>자기 자신 차단, 존재하지 않는 사용자 차단, 중복 차단을 방지한다.
   */
  @Transactional
  public void blockUser(Long blockerId, Long blockedId, String reason) {
    if (blockerId.equals(blockedId)) {
      throw new BusinessException(ErrorCode.SELF_BLOCK_NOT_ALLOWED);
    }

    if (!userRepository.existsById(blockedId)) {
      throw new EntityNotFoundException(ErrorCode.USER_NOT_FOUND);
    }

    if (userBlockRepository.existsByBlockerIdAndBlockedId(blockerId, blockedId)) {
      throw new BusinessException(ErrorCode.ALREADY_BLOCKED);
    }

    UserBlock userBlock = UserBlock.create(blockerId, blockedId, reason);
    userBlockRepository.save(userBlock);
  }

  /** 차단을 해제한다. 차단 내역이 없으면 예외를 발생시킨다. */
  @Transactional
  public void unblockUser(Long blockerId, Long blockedId) {
    if (!userBlockRepository.existsByBlockerIdAndBlockedId(blockerId, blockedId)) {
      throw new EntityNotFoundException(ErrorCode.ENTITY_NOT_FOUND, "차단 내역을 찾을 수 없습니다");
    }

    userBlockRepository.deleteByBlockerIdAndBlockedId(blockerId, blockedId);
  }

  /** 차단한 사용자 목록을 조회한다. 차단된 사용자의 프로필 정보와 차단 시간을 함께 반환한다. */
  public List<BlockedUserResponse> getBlockedUsers(Long blockerId) {
    List<UserBlock> blocks = userBlockRepository.findAllByBlockerId(blockerId);

    return blocks.stream()
        .map(
            block -> {
              User blockedUser =
                  userRepository
                      .findById(block.getBlockedId())
                      .orElseThrow(() -> new EntityNotFoundException(ErrorCode.USER_NOT_FOUND));
              return BlockedUserResponse.of(blockedUser, block.getCreatedAt());
            })
        .toList();
  }

  /** 차단 여부를 확인한다. 커뮤니티 게시글/댓글 필터링 등에서 활용한다. */
  public boolean isBlocked(Long blockerId, Long blockedId) {
    return userBlockRepository.existsByBlockerIdAndBlockedId(blockerId, blockedId);
  }
}
