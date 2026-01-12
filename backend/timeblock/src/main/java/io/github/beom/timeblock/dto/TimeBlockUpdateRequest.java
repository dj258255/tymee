package io.github.beom.timeblock.dto;

import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * 타임블록 수정 요청 DTO.
 *
 * <p>모든 필드가 선택적이며, null이 아닌 값만 업데이트한다.
 *
 * @param subjectId 과목 ID
 * @param blockDate 날짜
 * @param startTime 시작 시간
 * @param endTime 종료 시간
 * @param memo 메모 (최대 500자)
 * @param status 상태 (INCOMPLETE, COMPLETED, SKIPPED)
 * @param reminderEnabled 개별 알림 활성화 여부
 * @param reminderMinutesBefore 개별 알림 시간 (분 전)
 */
public record TimeBlockUpdateRequest(
    Long subjectId,
    LocalDate blockDate,
    LocalTime startTime,
    LocalTime endTime,
    @Size(max = 500, message = "메모는 500자 이내로 입력해주세요") String memo,
    String status,
    Boolean reminderEnabled,
    Integer reminderMinutesBefore) {}
