package io.github.beom.user.domain;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

/**
 * 사용자 차단 도메인 모델.
 *
 * <p>영속성 계층(Entity)과 분리하여 비즈니스 로직을 도메인에서 처리할 수 있도록 함.
 */
@Getter
@Builder
public class UserBlock {

  private Long id;
  private Long blockerId;
  private Long blockedId;
  private LocalDateTime createdAt;

  /**
   * 차단 관계를 생성한다.
   *
   * @param blockerId 차단하는 사용자 ID
   * @param blockedId 차단당하는 사용자 ID
   * @return 새로운 UserBlock 인스턴스
   */
  public static UserBlock create(Long blockerId, Long blockedId) {
    return UserBlock.builder()
        .blockerId(blockerId)
        .blockedId(blockedId)
        .createdAt(LocalDateTime.now())
        .build();
  }
}
