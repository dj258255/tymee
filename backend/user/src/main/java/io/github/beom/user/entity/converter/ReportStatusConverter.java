package io.github.beom.user.entity.converter;

import io.github.beom.core.persistence.converter.AbstractEnumConverter;
import io.github.beom.user.domain.vo.ReportStatus;
import jakarta.persistence.Converter;

/** ReportStatus enum을 DB 코드 값으로 변환하는 JPA 컨버터. */
@Converter(autoApply = true)
public class ReportStatusConverter extends AbstractEnumConverter<ReportStatus> {

  public ReportStatusConverter() {
    super(ReportStatus::getCode, ReportStatus::fromCode);
  }
}
