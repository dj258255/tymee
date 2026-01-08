package io.github.beom.core.web;

import jakarta.servlet.http.HttpServletRequest;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.accept.ApiVersionParser;
import org.springframework.web.accept.ApiVersionResolver;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.method.HandlerTypePredicate;
import org.springframework.web.servlet.config.annotation.ApiVersionConfigurer;
import org.springframework.web.servlet.config.annotation.PathMatchConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Spring Framework 7 공식 API Versioning 설정.
 *
 * <p>path segment 방식으로 버전 관리: /api/v1/users, /api/v2/users
 *
 * <p>컨트롤러의 @RequestMapping(version = "1.0") 에 따라 자동으로 버전 라우팅.
 */
@Configuration
public class ApiVersionConfig implements WebMvcConfigurer {

  @Override
  public void configureApiVersioning(ApiVersionConfigurer configurer) {
    configurer
        .useVersionResolver(new ApiPathVersionResolver())
        .addSupportedVersions("1.0", "2.0")
        .setDefaultVersion("1.0")
        .setVersionRequired(false)
        .setVersionParser(new SimpleVersionParser());
  }

  @Override
  public void configurePathMatch(PathMatchConfigurer configurer) {
    configurer.addPathPrefix(
        "/api/v{version}",
        HandlerTypePredicate.forAnnotation(RestController.class)
            .and(HandlerTypePredicate.forBasePackage("io.github.beom"))
            .and(HandlerTypePredicate.forBasePackage("org.springdoc").negate()));
  }

  /** /api/v{N}/... 경로에서만 버전을 추출하는 resolver. */
  private static class ApiPathVersionResolver implements ApiVersionResolver {

    private static final Pattern VERSION_PATTERN = Pattern.compile("^/api/v(\\d+)/.+");

    @Override
    public String resolveVersion(HttpServletRequest request) {
      String path = request.getRequestURI();
      Matcher matcher = VERSION_PATTERN.matcher(path);
      if (matcher.matches()) {
        return matcher.group(1); // "1" or "2"
      }
      return null; // API 경로가 아니면 null (Swagger 등)
    }
  }

  /**
   * 공식 예제 스타일의 버전 파서.
   *
   * <p>"v1" -> "1.0", "1" -> "1.0" 변환.
   */
  private static class SimpleVersionParser implements ApiVersionParser<String> {

    @Override
    public String parseVersion(String version) {
      if (version == null) {
        return null;
      }

      // "v" 또는 "V" prefix 제거
      if (version.startsWith("v") || version.startsWith("V")) {
        version = version.substring(1);
      }

      // minor version이 없으면 ".0" 추가
      if (!version.contains(".")) {
        version = version + ".0";
      }

      return version;
    }
  }
}
