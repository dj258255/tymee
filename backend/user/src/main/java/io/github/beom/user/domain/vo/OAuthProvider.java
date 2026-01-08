package io.github.beom.user.domain.vo;

import io.github.beom.core.persistence.converter.CodedEnum;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum OAuthProvider implements CodedEnum {
  GOOGLE("google"),
  APPLE("apple"),
  KAKAO("kakao");

  private final String code;

  public static OAuthProvider fromCode(String code) {
    for (OAuthProvider provider : values()) {
      if (provider.code.equals(code)) {
        return provider;
      }
    }
    throw new IllegalArgumentException("Unknown OAuth provider: " + code);
  }
}
