package io.github.beom.auth.util;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * JWT 설정 프로퍼티.
 *
 * <p>application.yml의 jwt.* 설정을 바인딩한다.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {

  private String secret;
  private long accessTokenExpiration = 1800; // 30분 (초)
  private long refreshTokenExpiration = 604800; // 7일 (초)
  private String issuer = "tymee";
}
