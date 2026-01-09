package io.github.beom.user.domain.vo;

/**
 * 신고 처리 상태.
 *
 * <p>신고 접수부터 처리 완료까지의 상태를 추적한다.
 */
public enum ReportStatus {
  PENDING,
  REVIEWING,
  RESOLVED,
  REJECTED
}
