package io.github.beom.auth.util;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

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
