package io.github.beom.dailytask.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * 일일 할일 생성 요청 DTO.
 *
 * @param taskDate 할일 날짜 (필수)
 * @param title 제목 (필수, 최대 200자)
 * @param estimatedMinutes 예상 소요 시간 (분, 선택)
 * @param priority 우선순위 (높을수록 먼저, 기본 0)
 * @param reminderTime 개별 알림 시간 (선택)
 */
public record DailyTaskCreateRequest(
    @NotNull(message = "할일 날짜는 필수입니다") LocalDate taskDate,
    @NotBlank(message = "제목은 필수입니다") @Size(max = 200, message = "제목은 200자 이내로 입력해주세요") String title,
    @Min(value = 0, message = "예상 소요 시간은 0 이상이어야 합니다") Integer estimatedMinutes,
    Integer priority,
    LocalTime reminderTime) {}
