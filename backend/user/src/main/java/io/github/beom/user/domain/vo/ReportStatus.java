package io.github.beom.user.domain.vo;

import io.github.beom.core.persistence.converter.CodedEnum;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 신고 처리 상태.
 *
 * <p>신고 접수부터 처리 완료까지의 상태를 추적한다.
 */
@Getter
@RequiredArgsConstructor
public enum ReportStatus implements CodedEnum {
  PENDING("pending"),
  REVIEWING("reviewing"),
  RESOLVED("resolved"),
  REJECTED("rejected");

  private final String code;

  public static ReportStatus fromCode(String code) {
    for (ReportStatus status : values()) {
      if (status.code.equals(code)) {
        return status;
      }
    }
    throw new IllegalArgumentException("Unknown report status: " + code);
  }
}
