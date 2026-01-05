package io.github.beom.user.entity;

import io.github.beom.user.domain.UserBlock;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

/**
 * 사용자 차단 JPA 엔티티.
 *
 * <p>blocker_id + blocked_id에 유니크 제약조건을 걸어 중복 차단 방지. 차단 목록 조회와 차단 여부 확인을 위해 양쪽 ID에 인덱스 추가.
 */
@Entity
@Table(
    name = "user_blocks",
    uniqueConstraints = {
      @UniqueConstraint(
          name = "uk_user_blocks_blocker_blocked",
          columnNames = {"blocker_id", "blocked_id"})
    },
    indexes = {
      @Index(name = "idx_user_blocks_blocker_id", columnList = "blocker_id"),
      @Index(name = "idx_user_blocks_blocked_id", columnList = "blocked_id")
    })
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserBlockEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "blocker_id", nullable = false)
  private Long blockerId;

  @Column(name = "blocked_id", nullable = false)
  private Long blockedId;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Builder
  public UserBlockEntity(Long id, Long blockerId, Long blockedId, LocalDateTime createdAt) {
    this.id = id;
    this.blockerId = blockerId;
    this.blockedId = blockedId;
    this.createdAt = createdAt;
  }

  /** 도메인 모델을 엔티티로 변환한다. */
  public static UserBlockEntity from(UserBlock userBlock) {
    return UserBlockEntity.builder()
        .id(userBlock.getId())
        .blockerId(userBlock.getBlockerId())
        .blockedId(userBlock.getBlockedId())
        .createdAt(userBlock.getCreatedAt())
        .build();
  }

  /** 엔티티를 도메인 모델로 변환한다. */
  public UserBlock toDomain() {
    return UserBlock.builder()
        .id(id)
        .blockerId(blockerId)
        .blockedId(blockedId)
        .createdAt(createdAt)
        .build();
  }
}
