package io.github.beom.timeblock.entity;

import io.github.beom.timeblock.domain.TimeBlock;
import io.github.beom.timeblock.domain.vo.TimeBlockStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * 타임블록 JPA 엔티티.
 *
 * <p>사용자의 공부 일정을 시간 단위로 저장한다. user_id + block_date로 특정 날짜의 타임블록을 조회하고, subject_id로 과목별 조회가 가능하도록
 * 인덱스 설정.
 */
@Entity
@Table(
    name = "time_blocks",
    indexes = {
      @Index(name = "idx_time_blocks_user_date", columnList = "user_id, block_date"),
      @Index(name = "idx_time_blocks_subject", columnList = "subject_id")
    })
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TimeBlockEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "user_id", nullable = false)
  private Long userId;

  @Column(name = "subject_id", nullable = false)
  private Long subjectId;

  @Column(name = "block_date", nullable = false)
  private LocalDate blockDate;

  @Column(name = "start_time", nullable = false)
  private LocalTime startTime;

  @Column(name = "end_time", nullable = false)
  private LocalTime endTime;

  @Column(name = "memo", length = 500)
  private String memo;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false)
  private TimeBlockStatus status;

  @Column(name = "reminder_enabled", nullable = false)
  private boolean reminderEnabled;

  @Column(name = "reminder_minutes_before")
  private Integer reminderMinutesBefore;

  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at")
  private LocalDateTime updatedAt;

  @Builder
  public TimeBlockEntity(
      Long id,
      Long userId,
      Long subjectId,
      LocalDate blockDate,
      LocalTime startTime,
      LocalTime endTime,
      String memo,
      TimeBlockStatus status,
      boolean reminderEnabled,
      Integer reminderMinutesBefore,
      LocalDateTime createdAt,
      LocalDateTime updatedAt) {
    this.id = id;
    this.userId = userId;
    this.subjectId = subjectId;
    this.blockDate = blockDate;
    this.startTime = startTime;
    this.endTime = endTime;
    this.memo = memo;
    this.status = status;
    this.reminderEnabled = reminderEnabled;
    this.reminderMinutesBefore = reminderMinutesBefore;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /** 도메인 모델을 엔티티로 변환한다. */
  public static TimeBlockEntity from(TimeBlock domain) {
    return TimeBlockEntity.builder()
        .id(domain.getId())
        .userId(domain.getUserId())
        .subjectId(domain.getSubjectId())
        .blockDate(domain.getBlockDate())
        .startTime(domain.getStartTime())
        .endTime(domain.getEndTime())
        .memo(domain.getMemo())
        .status(domain.getStatus())
        .reminderEnabled(domain.isReminderEnabled())
        .reminderMinutesBefore(domain.getReminderMinutesBefore())
        .createdAt(domain.getCreatedAt())
        .updatedAt(domain.getUpdatedAt())
        .build();
  }

  /** 엔티티를 도메인 모델로 변환한다. */
  public TimeBlock toDomain() {
    return TimeBlock.builder()
        .id(id)
        .userId(userId)
        .subjectId(subjectId)
        .blockDate(blockDate)
        .startTime(startTime)
        .endTime(endTime)
        .memo(memo)
        .status(status)
        .reminderEnabled(reminderEnabled)
        .reminderMinutesBefore(reminderMinutesBefore)
        .createdAt(createdAt)
        .updatedAt(updatedAt)
        .build();
  }
}
