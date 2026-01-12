package io.github.beom.timeblock.dto;

import io.github.beom.timeblock.domain.TimeBlock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import lombok.Builder;

/**
 * 타임블록 응답 DTO.
 *
 * @param id 타임블록 ID
 * @param userId 사용자 ID
 * @param subjectId 과목 ID
 * @param blockDate 날짜
 * @param startTime 시작 시간
 * @param endTime 종료 시간
 * @param durationMinutes 소요 시간 (분)
 * @param memo 메모
 * @param status 상태
 * @param reminderEnabled 개별 알림 활성화 여부
 * @param reminderMinutesBefore 개별 알림 시간 (분 전, null이면 전역 설정 사용)
 * @param createdAt 생성일시
 * @param updatedAt 수정일시
 */
@Builder
public record TimeBlockResponse(
    Long id,
    Long userId,
    Long subjectId,
    LocalDate blockDate,
    LocalTime startTime,
    LocalTime endTime,
    int durationMinutes,
    String memo,
    String status,
    boolean reminderEnabled,
    Integer reminderMinutesBefore,
    LocalDateTime createdAt,
    LocalDateTime updatedAt) {

  public static TimeBlockResponse from(TimeBlock domain) {
    return TimeBlockResponse.builder()
        .id(domain.getId())
        .userId(domain.getUserId())
        .subjectId(domain.getSubjectId())
        .blockDate(domain.getBlockDate())
        .startTime(domain.getStartTime())
        .endTime(domain.getEndTime())
        .durationMinutes(domain.getDurationMinutes())
        .memo(domain.getMemo())
        .status(domain.getStatus().name())
        .reminderEnabled(domain.isReminderEnabled())
        .reminderMinutesBefore(domain.getReminderMinutesBefore())
        .createdAt(domain.getCreatedAt())
        .updatedAt(domain.getUpdatedAt())
        .build();
  }
}
