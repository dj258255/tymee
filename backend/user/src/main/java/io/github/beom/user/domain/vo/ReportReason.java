package io.github.beom.user.domain.vo;

/**
 * 신고 사유.
 *
 * <p>미리 정의된 신고 사유를 enum으로 관리하여 일관된 신고 처리가 가능하도록 한다.
 */
public enum ReportReason {
  SPAM,
  HARASSMENT,
  HATE_SPEECH,
  INAPPROPRIATE_CONTENT,
  IMPERSONATION,
  OTHER
}
