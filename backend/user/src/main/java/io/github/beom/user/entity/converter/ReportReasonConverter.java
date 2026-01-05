package io.github.beom.user.entity.converter;

import io.github.beom.core.persistence.converter.AbstractEnumConverter;
import io.github.beom.user.domain.vo.ReportReason;
import jakarta.persistence.Converter;

/** ReportReason enum을 DB 코드 값으로 변환하는 JPA 컨버터. */
@Converter(autoApply = true)
public class ReportReasonConverter extends AbstractEnumConverter<ReportReason> {

  public ReportReasonConverter() {
    super(ReportReason::getCode, ReportReason::fromCode);
  }
}
