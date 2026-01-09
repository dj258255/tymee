package io.github.beom.user.domain.vo;

/**
 * 신고 대상 유형.
 *
 * <p>사용자, 게시글, 댓글 등 다양한 대상을 하나의 신고 테이블에서 처리하기 위해 타입을 구분한다.
 */
public enum ReportType {
  USER,
  POST,
  COMMENT
}
