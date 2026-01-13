package io.github.beom.dailytask.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * 일일 할일 수정 요청 DTO.
 *
 * @param taskDate 할일 날짜 (선택)
 * @param title 제목 (선택, 최대 200자)
 * @param estimatedMinutes 예상 소요 시간 (분, 선택)
 * @param completed 완료 여부 (선택)
 * @param priority 우선순위 (선택)
 * @param reminderTime 개별 알림 시간 (선택)
 */
public record DailyTaskUpdateRequest(
    LocalDate taskDate,
    @Size(max = 200, message = "제목은 200자 이내로 입력해주세요") String title,
    @Min(value = 0, message = "예상 소요 시간은 0 이상이어야 합니다") Integer estimatedMinutes,
    Boolean completed,
    Integer priority,
    LocalTime reminderTime) {}
