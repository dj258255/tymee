package io.github.beom.user.domain.vo;

import io.github.beom.core.persistence.converter.CodedEnum;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 신고 대상 유형.
 *
 * <p>사용자, 게시글, 댓글 등 다양한 대상을 하나의 신고 테이블에서 처리하기 위해 타입을 구분한다.
 */
@Getter
@RequiredArgsConstructor
public enum ReportType implements CodedEnum {
  USER("user"),
  POST("post"),
  COMMENT("comment");

  private final String code;

  public static ReportType fromCode(String code) {
    for (ReportType type : values()) {
      if (type.code.equals(code)) {
        return type;
      }
    }
    throw new IllegalArgumentException("Unknown report type: " + code);
  }
}
