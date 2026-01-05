package io.github.beom.user.entity.converter;

import io.github.beom.core.persistence.converter.AbstractEnumConverter;
import io.github.beom.user.domain.vo.ReportType;
import jakarta.persistence.Converter;

/** ReportType enum을 DB 코드 값으로 변환하는 JPA 컨버터. */
@Converter(autoApply = true)
public class ReportTypeConverter extends AbstractEnumConverter<ReportType> {

  public ReportTypeConverter() {
    super(ReportType::getCode, ReportType::fromCode);
  }
}
