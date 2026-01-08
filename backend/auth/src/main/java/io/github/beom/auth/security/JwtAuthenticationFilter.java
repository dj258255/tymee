package io.github.beom.auth.security;

import io.github.beom.auth.util.JwtUtil;
import io.github.beom.core.security.UserPrincipal;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

/** JWT 토큰을 검증하고 SecurityContext에 Authentication 설정. */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private static final String AUTHORIZATION_HEADER = "Authorization";
  private static final String BEARER_PREFIX = "Bearer ";

  private final JwtUtil jwtUtil;

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    String token = extractToken(request);

    if (StringUtils.hasText(token)) {
      try {
        JwtUtil.Claims claims = jwtUtil.parseAccessToken(token);
        setAuthentication(claims);
      } catch (Exception e) {
        log.debug("JWT 인증 실패: {}", e.getMessage());
        // 인증 실패 시 SecurityContext를 비워둠 (permitAll 외 요청은 403)
      }
    }

    filterChain.doFilter(request, response);
  }

  private String extractToken(HttpServletRequest request) {
    String bearerToken = request.getHeader(AUTHORIZATION_HEADER);
    if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(BEARER_PREFIX)) {
      return bearerToken.substring(BEARER_PREFIX.length());
    }
    return null;
  }

  private void setAuthentication(JwtUtil.Claims claims) {
    List<SimpleGrantedAuthority> authorities =
        List.of(new SimpleGrantedAuthority("ROLE_" + claims.role()));

    UserPrincipal principal = new UserPrincipal(claims.userId(), claims.email(), claims.role());

    UsernamePasswordAuthenticationToken authentication =
        new UsernamePasswordAuthenticationToken(principal, null, authorities);

    SecurityContextHolder.getContext().setAuthentication(authentication);
  }
}
