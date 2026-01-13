package io.github.beom.dailytask.domain;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import lombok.Builder;
import lombok.Getter;

/**
 * 일일 할일 도메인 모델.
 *
 * <p>사용자의 일일 할일을 관리한다. 우선순위, 예상 소요 시간, 개별 알림 시간을 지원한다.
 */
@Getter
@Builder
public class DailyTask {

  private Long id;
  private Long userId;
  private LocalDate taskDate;
  private String title;
  private Integer estimatedMinutes;
  private boolean completed;
  private int priority;
  private LocalTime reminderTime;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
  private LocalDateTime deletedAt;

  /**
   * 새로운 일일 할일을 생성한다.
   *
   * @param userId 사용자 ID
   * @param taskDate 할일 날짜
   * @param title 제목
   * @param estimatedMinutes 예상 소요 시간 (분)
   * @param priority 우선순위 (높을수록 먼저)
   * @param reminderTime 개별 알림 시간 (선택)
   * @return 새로운 DailyTask 인스턴스
   */
  public static DailyTask create(
      Long userId,
      LocalDate taskDate,
      String title,
      Integer estimatedMinutes,
      Integer priority,
      LocalTime reminderTime) {
    return DailyTask.builder()
        .userId(userId)
        .taskDate(taskDate)
        .title(title)
        .estimatedMinutes(estimatedMinutes)
        .completed(false)
        .priority(priority != null ? priority : 0)
        .reminderTime(reminderTime)
        .createdAt(LocalDateTime.now())
        .updatedAt(LocalDateTime.now())
        .build();
  }

  /** 할일을 완료 상태로 변경한다. */
  public DailyTask complete() {
    return DailyTask.builder()
        .id(this.id)
        .userId(this.userId)
        .taskDate(this.taskDate)
        .title(this.title)
        .estimatedMinutes(this.estimatedMinutes)
        .completed(true)
        .priority(this.priority)
        .reminderTime(this.reminderTime)
        .createdAt(this.createdAt)
        .updatedAt(LocalDateTime.now())
        .deletedAt(this.deletedAt)
        .build();
  }

  /** 할일을 미완료 상태로 변경한다. */
  public DailyTask uncomplete() {
    return DailyTask.builder()
        .id(this.id)
        .userId(this.userId)
        .taskDate(this.taskDate)
        .title(this.title)
        .estimatedMinutes(this.estimatedMinutes)
        .completed(false)
        .priority(this.priority)
        .reminderTime(this.reminderTime)
        .createdAt(this.createdAt)
        .updatedAt(LocalDateTime.now())
        .deletedAt(this.deletedAt)
        .build();
  }

  /** 할일 정보를 업데이트한다. */
  public DailyTask update(
      LocalDate taskDate,
      String title,
      Integer estimatedMinutes,
      Boolean completed,
      Integer priority,
      LocalTime reminderTime) {
    return DailyTask.builder()
        .id(this.id)
        .userId(this.userId)
        .taskDate(taskDate != null ? taskDate : this.taskDate)
        .title(title != null ? title : this.title)
        .estimatedMinutes(estimatedMinutes != null ? estimatedMinutes : this.estimatedMinutes)
        .completed(completed != null ? completed : this.completed)
        .priority(priority != null ? priority : this.priority)
        .reminderTime(reminderTime != null ? reminderTime : this.reminderTime)
        .createdAt(this.createdAt)
        .updatedAt(LocalDateTime.now())
        .deletedAt(this.deletedAt)
        .build();
  }

  /** 할일을 소프트 삭제한다. */
  public DailyTask softDelete() {
    return DailyTask.builder()
        .id(this.id)
        .userId(this.userId)
        .taskDate(this.taskDate)
        .title(this.title)
        .estimatedMinutes(this.estimatedMinutes)
        .completed(this.completed)
        .priority(this.priority)
        .reminderTime(this.reminderTime)
        .createdAt(this.createdAt)
        .updatedAt(LocalDateTime.now())
        .deletedAt(LocalDateTime.now())
        .build();
  }

  /** 삭제된 할일인지 확인한다. */
  public boolean isDeleted() {
    return this.deletedAt != null;
  }
}
