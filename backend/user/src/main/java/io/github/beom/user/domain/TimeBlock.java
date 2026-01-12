package io.github.beom.user.domain;

import io.github.beom.user.domain.vo.TimeBlockStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import lombok.Builder;
import lombok.Getter;

/**
 * 타임블록 도메인 모델.
 *
 * <p>사용자의 공부 일정을 시간 단위로 관리한다. 각 블록은 특정 과목에 대한 학습 계획을 나타낸다.
 */
@Getter
@Builder
public class TimeBlock {

  private Long id;
  private Long userId;
  private Long subjectId;
  private LocalDate blockDate;
  private LocalTime startTime;
  private LocalTime endTime;
  private String memo;
  private TimeBlockStatus status;
  private boolean reminderEnabled;
  private Integer reminderMinutesBefore;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;

  /**
   * 새로운 타임블록을 생성한다.
   *
   * @param userId 사용자 ID
   * @param subjectId 과목 ID
   * @param blockDate 날짜
   * @param startTime 시작 시간
   * @param endTime 종료 시간
   * @param memo 메모 (선택)
   * @param reminderEnabled 개별 알림 활성화 여부
   * @param reminderMinutesBefore 개별 알림 시간 (분 전, null이면 전역 설정 사용)
   * @return 새로운 TimeBlock 인스턴스
   */
  public static TimeBlock create(
      Long userId,
      Long subjectId,
      LocalDate blockDate,
      LocalTime startTime,
      LocalTime endTime,
      String memo,
      boolean reminderEnabled,
      Integer reminderMinutesBefore) {
    return TimeBlock.builder()
        .userId(userId)
        .subjectId(subjectId)
        .blockDate(blockDate)
        .startTime(startTime)
        .endTime(endTime)
        .memo(memo)
        .status(TimeBlockStatus.INCOMPLETE)
        .reminderEnabled(reminderEnabled)
        .reminderMinutesBefore(reminderMinutesBefore)
        .createdAt(LocalDateTime.now())
        .updatedAt(LocalDateTime.now())
        .build();
  }

  /** 타임블록을 완료 상태로 변경한다. */
  public TimeBlock complete() {
    return TimeBlock.builder()
        .id(this.id)
        .userId(this.userId)
        .subjectId(this.subjectId)
        .blockDate(this.blockDate)
        .startTime(this.startTime)
        .endTime(this.endTime)
        .memo(this.memo)
        .status(TimeBlockStatus.COMPLETED)
        .reminderEnabled(this.reminderEnabled)
        .reminderMinutesBefore(this.reminderMinutesBefore)
        .createdAt(this.createdAt)
        .updatedAt(LocalDateTime.now())
        .build();
  }

  /** 타임블록을 건너뜀 상태로 변경한다. */
  public TimeBlock skip() {
    return TimeBlock.builder()
        .id(this.id)
        .userId(this.userId)
        .subjectId(this.subjectId)
        .blockDate(this.blockDate)
        .startTime(this.startTime)
        .endTime(this.endTime)
        .memo(this.memo)
        .status(TimeBlockStatus.SKIPPED)
        .reminderEnabled(this.reminderEnabled)
        .reminderMinutesBefore(this.reminderMinutesBefore)
        .createdAt(this.createdAt)
        .updatedAt(LocalDateTime.now())
        .build();
  }

  /** 타임블록 정보를 업데이트한다. */
  public TimeBlock update(
      Long subjectId,
      LocalDate blockDate,
      LocalTime startTime,
      LocalTime endTime,
      String memo,
      TimeBlockStatus status,
      Boolean reminderEnabled,
      Integer reminderMinutesBefore) {
    return TimeBlock.builder()
        .id(this.id)
        .userId(this.userId)
        .subjectId(subjectId != null ? subjectId : this.subjectId)
        .blockDate(blockDate != null ? blockDate : this.blockDate)
        .startTime(startTime != null ? startTime : this.startTime)
        .endTime(endTime != null ? endTime : this.endTime)
        .memo(memo != null ? memo : this.memo)
        .status(status != null ? status : this.status)
        .reminderEnabled(reminderEnabled != null ? reminderEnabled : this.reminderEnabled)
        .reminderMinutesBefore(
            reminderMinutesBefore != null ? reminderMinutesBefore : this.reminderMinutesBefore)
        .createdAt(this.createdAt)
        .updatedAt(LocalDateTime.now())
        .build();
  }

  /** 타임블록의 소요 시간을 분 단위로 계산한다. */
  public int getDurationMinutes() {
    return (int) java.time.Duration.between(startTime, endTime).toMinutes();
  }
}
