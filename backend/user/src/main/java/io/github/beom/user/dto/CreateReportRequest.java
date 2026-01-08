package io.github.beom.user.dto;

import io.github.beom.user.domain.vo.ReportReason;
import io.github.beom.user.domain.vo.ReportType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 신고 생성 요청 DTO.
 *
 * @param targetType 신고 대상 유형 (USER, POST, COMMENT)
 * @param targetId 신고 대상 ID
 * @param reason 신고 사유
 * @param description 상세 설명 (선택, 최대 500자)
 */
public record CreateReportRequest(
    @NotNull(message = "신고 대상 유형은 필수입니다") ReportType targetType,
    @NotNull(message = "신고 대상 ID는 필수입니다") Long targetId,
    @NotNull(message = "신고 사유는 필수입니다") ReportReason reason,
    @Size(max = 500, message = "상세 설명은 500자를 초과할 수 없습니다") String description) {}
