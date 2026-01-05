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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

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
