package io.github.beom.timeblock.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * 타임블록 생성 요청 DTO.
 *
 * @param subjectId 과목 ID (필수)
 * @param blockDate 날짜 (필수)
 * @param startTime 시작 시간 (필수)
 * @param endTime 종료 시간 (필수)
 * @param memo 메모 (선택, 최대 500자)
 * @param reminderEnabled 개별 알림 활성화 여부 (기본 true)
 * @param reminderMinutesBefore 개별 알림 시간 (분 전, null이면 전역 설정 사용)
 */
public record TimeBlockCreateRequest(
    @NotNull(message = "과목 ID는 필수입니다") Long subjectId,
    @NotNull(message = "날짜는 필수입니다") LocalDate blockDate,
    @NotNull(message = "시작 시간은 필수입니다") LocalTime startTime,
    @NotNull(message = "종료 시간은 필수입니다") LocalTime endTime,
    @Size(max = 500, message = "메모는 500자 이내로 입력해주세요") String memo,
    Boolean reminderEnabled,
    Integer reminderMinutesBefore) {}
