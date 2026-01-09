package io.github.beom.user.entity;

import io.github.beom.user.domain.Report;
import io.github.beom.user.domain.vo.ReportReason;
import io.github.beom.user.domain.vo.ReportStatus;
import io.github.beom.user.domain.vo.ReportType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

/**
 * 신고 JPA 엔티티.
 *
 * <p>신고자 기준 조회, 대상 기준 조회를 위해 복합 인덱스 추가. 처리 상태별 조회를 위한 status 인덱스도 포함.
 */
@Entity
@Table(
    name = "reports",
    indexes = {
      @Index(name = "idx_reports_reporter_id", columnList = "reporter_id"),
      @Index(name = "idx_reports_target", columnList = "target_type, target_id"),
      @Index(name = "idx_reports_status", columnList = "status")
    })
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ReportEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "reporter_id", nullable = false)
  private Long reporterId;

  @Enumerated(EnumType.STRING)
  @Column(name = "target_type", nullable = false, length = 20)
  private ReportType targetType;

  @Column(name = "target_id", nullable = false)
  private Long targetId;

  @Enumerated(EnumType.STRING)
  @Column(name = "reason", nullable = false, length = 30)
  private ReportReason reason;

  @Column(name = "description", length = 500)
  private String description;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 20)
  private ReportStatus status;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "resolved_at")
  private LocalDateTime resolvedAt;

  @Builder
  public ReportEntity(
      Long id,
      Long reporterId,
      ReportType targetType,
      Long targetId,
      ReportReason reason,
      String description,
      ReportStatus status,
      LocalDateTime createdAt,
      LocalDateTime resolvedAt) {
    this.id = id;
    this.reporterId = reporterId;
    this.targetType = targetType;
    this.targetId = targetId;
    this.reason = reason;
    this.description = description;
    this.status = status;
    this.createdAt = createdAt;
    this.resolvedAt = resolvedAt;
  }

  /** 도메인 모델을 엔티티로 변환한다. */
  public static ReportEntity from(Report report) {
    return ReportEntity.builder()
        .id(report.getId())
        .reporterId(report.getReporterId())
        .targetType(report.getTargetType())
        .targetId(report.getTargetId())
        .reason(report.getReason())
        .description(report.getDescription())
        .status(report.getStatus())
        .createdAt(report.getCreatedAt())
        .resolvedAt(report.getResolvedAt())
        .build();
  }

  /** 엔티티를 도메인 모델로 변환한다. */
  public Report toDomain() {
    return Report.builder()
        .id(id)
        .reporterId(reporterId)
        .targetType(targetType)
        .targetId(targetId)
        .reason(reason)
        .description(description)
        .status(status)
        .createdAt(createdAt)
        .resolvedAt(resolvedAt)
        .build();
  }
}
