package io.github.beom.dailytask.dto;

import io.github.beom.dailytask.domain.DailyTask;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import lombok.Builder;

/**
 * 일일 할일 응답 DTO.
 *
 * @param id 할일 ID
 * @param userId 사용자 ID
 * @param taskDate 할일 날짜
 * @param title 제목
 * @param estimatedMinutes 예상 소요 시간 (분)
 * @param completed 완료 여부
 * @param priority 우선순위
 * @param reminderTime 개별 알림 시간
 * @param createdAt 생성일시
 * @param updatedAt 수정일시
 */
@Builder
public record DailyTaskResponse(
    Long id,
    Long userId,
    LocalDate taskDate,
    String title,
    Integer estimatedMinutes,
    boolean completed,
    int priority,
    LocalTime reminderTime,
    LocalDateTime createdAt,
    LocalDateTime updatedAt) {

  public static DailyTaskResponse from(DailyTask domain) {
    return DailyTaskResponse.builder()
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
        .build();
  }
}
