package io.github.beom.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import java.util.List;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * OpenAPI(Swagger) 설정.
 *
 * <p>Spring Framework 7 API Versioning과 연동하여 버전별 API 문서를 생성한다.
 */
@Configuration
public class OpenApiConfig {

  @Value("${spring.profiles.active:local}")
  private String activeProfile;

  @Bean
  public OpenAPI openAPI() {
    String securitySchemeName = "bearerAuth";

    return new OpenAPI()
        .info(apiInfo())
        .servers(servers())
        .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
        .components(
            new Components()
                .addSecuritySchemes(
                    securitySchemeName,
                    new SecurityScheme()
                        .name(securitySchemeName)
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")
                        .description("JWT 토큰을 입력하세요 (Bearer 접두사 제외)")));
  }

  /**
   * API v1 그룹.
   *
   * <p>@RequestMapping(version = "1.0") 어노테이션이 있는 컨트롤러만 포함.
   */
  @Bean
  public GroupedOpenApi v1Api() {
    return GroupedOpenApi.builder()
        .group("v1")
        .displayName("API v1")
        .packagesToScan("io.github.beom")
        .addOpenApiMethodFilter(method -> hasVersion(method.getDeclaringClass(), "1.0"))
        .build();
  }

  /**
   * API v2 그룹.
   *
   * <p>@RequestMapping(version = "2.0") 어노테이션이 있는 컨트롤러만 포함.
   */
  @Bean
  public GroupedOpenApi v2Api() {
    return GroupedOpenApi.builder()
        .group("v2")
        .displayName("API v2")
        .packagesToScan("io.github.beom")
        .addOpenApiMethodFilter(method -> hasVersion(method.getDeclaringClass(), "2.0"))
        .build();
  }

  /** 클래스에 @RequestMapping(version = "X.0") 가 있는지 확인. */
  private boolean hasVersion(Class<?> clazz, String version) {
    RequestMapping mapping = clazz.getAnnotation(RequestMapping.class);
    return mapping != null && version.equals(mapping.version());
  }

  private Info apiInfo() {
    return new Info()
        .title("Tymee API")
        .description("Tymee 백엔드 API 문서")
        .version("1.0.0")
        .contact(new Contact().name("Tymee Team").email("support@tymee.io"))
        .license(new License().name("MIT License").url("https://opensource.org/licenses/MIT"));
  }

  private List<Server> servers() {
    return switch (activeProfile) {
      case "staging" ->
          List.of(new Server().url("https://staging-api.tymee.io").description("Staging"));
      case "prod" -> List.of(new Server().url("https://api.tymee.io").description("Production"));
      default -> List.of(new Server().url("http://localhost:8080").description("Local"));
    };
  }
}
