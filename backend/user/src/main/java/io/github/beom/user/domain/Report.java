package io.github.beom.user.domain;

import io.github.beom.user.domain.vo.ReportReason;
import io.github.beom.user.domain.vo.ReportStatus;
import io.github.beom.user.domain.vo.ReportType;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

/**
 * 신고 도메인 모델.
 *
 * <p>사용자/게시글/댓글 등 다양한 대상에 대한 신고를 통합 관리한다. targetType과 targetId로 신고 대상을 식별한다.
 */
@Getter
@Builder
public class Report {

  private Long id;
  private Long reporterId;
  private ReportType targetType;
  private Long targetId;
  private ReportReason reason;
  private String description;
  private ReportStatus status;
  private LocalDateTime createdAt;
  private LocalDateTime resolvedAt;

  /**
   * 신고를 생성한다.
   *
   * @param reporterId 신고자 ID
   * @param targetType 신고 대상 유형 (USER, POST, COMMENT)
   * @param targetId 신고 대상 ID
   * @param reason 신고 사유
   * @param description 상세 설명 (선택)
   */
  public static Report create(
      Long reporterId,
      ReportType targetType,
      Long targetId,
      ReportReason reason,
      String description) {
    return Report.builder()
        .reporterId(reporterId)
        .targetType(targetType)
        .targetId(targetId)
        .reason(reason)
        .description(description)
        .status(ReportStatus.PENDING)
        .createdAt(LocalDateTime.now())
        .build();
  }
}
