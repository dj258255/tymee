package io.github.beom.auth.signup;

import io.github.beom.core.exception.BusinessException;
import io.github.beom.core.exception.ErrorCode;
import io.github.beom.auth.jwt.CookieUtil;
import io.github.beom.auth.jwt.JwtTokenProvider;
import io.github.beom.user.domain.User;
import io.github.beom.user.domain.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 회원가입 Use Case Handler
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SignupHandler {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final CookieUtil cookieUtil;

    @Transactional
    public SignupResponse handle(
        SignupCommand command,
        HttpServletRequest request,
        HttpServletResponse response
    ) {
        // 1. 이메일 중복 체크
        if (userRepository.existsByEmail(command.getEmail())) {
            throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE, "Email already exists");
        }

        // 2. 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(command.getPassword());

        // 3. 도메인 엔티티 생성
        User user = User.create(command.getEmail(), encodedPassword, command.getName());

        // 4. 저장
        User savedUser = userRepository.save(user);

        // 5. JWT 토큰 생성
        String accessToken = jwtTokenProvider.createAccessToken(savedUser.getId(), savedUser.getEmail());
        String refreshToken = jwtTokenProvider.createRefreshToken(savedUser.getId());

        // 6. 클라이언트 타입 판별 (웹 or 모바일)
        String clientType = request.getHeader("X-Client-Type");
        boolean isMobile = "mobile".equalsIgnoreCase(clientType);

        if (isMobile) {
            // 모바일: JSON Body로 토큰 반환
            log.debug("Mobile signup: {}", savedUser.getEmail());
            return SignupResponse.forMobile(
                savedUser,
                accessToken,
                refreshToken,
                jwtTokenProvider.getAccessTokenExpirationInSeconds()
            );
        } else {
            // 웹: HttpOnly Cookie로 토큰 설정
            log.debug("Web signup: {}", savedUser.getEmail());
            cookieUtil.createAccessTokenCookie(
                response,
                accessToken,
                jwtTokenProvider.getAccessTokenExpirationInSeconds()
            );
            cookieUtil.createRefreshTokenCookie(
                response,
                refreshToken,
                jwtTokenProvider.getRefreshTokenExpirationInSeconds()
            );

            return SignupResponse.forWeb(savedUser);
        }
    }
}
