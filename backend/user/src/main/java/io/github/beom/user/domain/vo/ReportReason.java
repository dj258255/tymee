package io.github.beom.user.domain.vo;

import io.github.beom.core.persistence.converter.CodedEnum;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 신고 사유.
 *
 * <p>미리 정의된 신고 사유를 enum으로 관리하여 일관된 신고 처리가 가능하도록 한다.
 */
@Getter
@RequiredArgsConstructor
public enum ReportReason implements CodedEnum {
  SPAM("spam"),
  HARASSMENT("harassment"),
  HATE_SPEECH("hate_speech"),
  INAPPROPRIATE_CONTENT("inappropriate_content"),
  IMPERSONATION("impersonation"),
  OTHER("other");

  private final String code;

  public static ReportReason fromCode(String code) {
    for (ReportReason reason : values()) {
      if (reason.code.equals(code)) {
        return reason;
      }
    }
    throw new IllegalArgumentException("Unknown report reason: " + code);
  }
}
