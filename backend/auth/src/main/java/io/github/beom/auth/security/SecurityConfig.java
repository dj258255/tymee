package io.github.beom.auth.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/** Spring Security 설정. JWT 기반 Stateless 인증. */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

  private final JwtAuthenticationFilter jwtAuthenticationFilter;

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    return http.csrf(AbstractHttpConfigurer::disable)
        .sessionManagement(
            session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .formLogin(AbstractHttpConfigurer::disable)
        .httpBasic(AbstractHttpConfigurer::disable)
        .authorizeHttpRequests(
            auth ->
                auth
                    // 인증 없이 접근 가능한 엔드포인트 (API versioning prefix 포함)
                    .requestMatchers("/api/*/auth/login/**", "/api/*/auth/refresh")
                    .permitAll()
                    // 개발용 테스트 로그인 (local, test 환경에서만 컨트롤러 활성화됨)
                    .requestMatchers("/api/*/dev/auth/**")
                    .permitAll()
                    .requestMatchers(
                        "/actuator/**",
                        "/swagger-ui/**",
                        "/swagger-ui.html",
                        "/v3/api-docs/**",
                        "/api-docs/**")
                    .permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/*/users/check-nickname")
                    .permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/*/users/*/profile")
                    .permitAll()
                    // 그 외 모든 요청은 인증 필요
                    .anyRequest()
                    .authenticated())
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
        .build();
  }
}
