package io.github.beom.dailytask.entity;

import io.github.beom.dailytask.domain.DailyTask;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
 * 일일 할일 JPA 엔티티.
 *
 * <p>사용자의 일일 할일을 저장한다. user_id + task_date로 특정 날짜의 할일을 조회하고, user_id + is_completed로 완료/미완료 필터링이
 * 가능하도록 인덱스 설정.
 */
@Entity
@Table(
    name = "daily_tasks",
    indexes = {
      @Index(name = "idx_daily_tasks_user_date", columnList = "user_id, task_date"),
      @Index(name = "idx_daily_tasks_completed", columnList = "user_id, is_completed")
    })
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DailyTaskEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "user_id", nullable = false)
  private Long userId;

  @Column(name = "task_date", nullable = false)
  private LocalDate taskDate;

  @Column(name = "title", nullable = false, length = 200)
  private String title;

  @Column(name = "estimated_minutes")
  private Integer estimatedMinutes;

  @Column(name = "is_completed")
  private boolean completed;

  @Column(name = "priority")
  private int priority;

  @Column(name = "reminder_time")
  private LocalTime reminderTime;

  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at")
  private LocalDateTime updatedAt;

  @Column(name = "deleted_at")
  private LocalDateTime deletedAt;

  @Builder
  public DailyTaskEntity(
      Long id,
      Long userId,
      LocalDate taskDate,
      String title,
      Integer estimatedMinutes,
      boolean completed,
      int priority,
      LocalTime reminderTime,
      LocalDateTime createdAt,
      LocalDateTime updatedAt,
      LocalDateTime deletedAt) {
    this.id = id;
    this.userId = userId;
    this.taskDate = taskDate;
    this.title = title;
    this.estimatedMinutes = estimatedMinutes;
    this.completed = completed;
    this.priority = priority;
    this.reminderTime = reminderTime;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedAt = deletedAt;
  }

  /** 도메인 모델을 엔티티로 변환한다. */
  public static DailyTaskEntity from(DailyTask domain) {
    return DailyTaskEntity.builder()
        .id(domain.getId())
        .userId(domain.getUserId())
        .taskDate(domain.getTaskDate())
        .title(domain.getTitle())
        .estimatedMinutes(domain.getEstimatedMinutes())
        .completed(domain.isCompleted())
        .priority(domain.getPriority())
        .reminderTime(domain.getReminderTime())
        .createdAt(domain.getCreatedAt())
        .updatedAt(domain.getUpdatedAt())
        .deletedAt(domain.getDeletedAt())
        .build();
  }

  /** 엔티티를 도메인 모델로 변환한다. */
  public DailyTask toDomain() {
    return DailyTask.builder()
        .id(id)
        .userId(userId)
        .taskDate(taskDate)
        .title(title)
        .estimatedMinutes(estimatedMinutes)
        .completed(completed)
        .priority(priority)
        .reminderTime(reminderTime)
        .createdAt(createdAt)
        .updatedAt(updatedAt)
        .deletedAt(deletedAt)
        .build();
  }
}
