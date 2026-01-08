package io.github.beom.core.security;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

/**
 * 현재 인증된 사용자의 Principal을 주입받기 위한 어노테이션.
 *
 * <p>사용 예:
 *
 * <pre>{@code
 * @GetMapping("/{id}")
 * public UserResponse getUser(@CurrentUser UserPrincipal user, @PathVariable Long id) {
 *   return userService.getById(user.userId());
 * }
 * }</pre>
 */
@Target({ElementType.PARAMETER, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@AuthenticationPrincipal
public @interface CurrentUser {}
