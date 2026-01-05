package io.github.beom.user.entity.converter;

import io.github.beom.core.persistence.converter.AbstractEnumConverter;
import io.github.beom.user.domain.vo.DevicePlatform;
import jakarta.persistence.Converter;

/** DevicePlatform enum을 DB 코드 값으로 변환하는 JPA 컨버터. */
@Converter(autoApply = true)
public class DevicePlatformConverter extends AbstractEnumConverter<DevicePlatform> {

  public DevicePlatformConverter() {
    super(DevicePlatform::getCode, DevicePlatform::fromCode);
  }
}
