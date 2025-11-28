package io.github.beom.auth.kakao;

import io.github.beom.auth.jwt.JwtTokenProvider;
import io.github.beom.user.domain.AuthProvider;
import io.github.beom.user.domain.User;
import io.github.beom.user.domain.UserRepository;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 카카오 로그인 핸들러 (Command Handler)
 */
@Service
@RequiredArgsConstructor
public class KakaoLoginHandler {
    private static final Logger log = LogManager.getLogger(KakaoLoginHandler.class);
    private final KakaoAuthService kakaoAuthService;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * 카카오 로그인 처리
     * - 카카오 API로 사용자 정보 조회
     * - 기존 사용자면 로그인, 신규 사용자면 자동 회원가입
     * - JWT 토큰 생성 및 반환
     */
    @Transactional
    public KakaoLoginResponse handle(KakaoLoginCommand command) {
        // 1. 카카오 액세스 토큰으로 사용자 정보 조회
        KakaoUserInfo kakaoUserInfo = kakaoAuthService.getUserInfo(command.getAccessToken());

        // 2. 이메일과 닉네임 추출
        String email = kakaoUserInfo.getEmail();
        String nickname = kakaoUserInfo.getNickname();
        String providerId = kakaoUserInfo.getProviderId();

        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Kakao account email is required");
        }

        // 3. 기존 사용자 조회 또는 신규 생성
        User user = userRepository.findByAuthProviderAndProviderId(AuthProvider.KAKAO, providerId)
            .orElseGet(() -> {
                // 신규 사용자 생성
                User newUser = User.createOAuthUser(
                    email,
                    nickname != null ? nickname : "카카오 사용자",
                    AuthProvider.KAKAO,
                    providerId
                );
                User savedUser = userRepository.save(newUser);
                log.info("New Kakao user created: {}", savedUser.getEmail());
                return savedUser;
            });

        // 4. JWT 토큰 생성
        String accessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getEmail());
        String refreshToken = jwtTokenProvider.createRefreshToken(user.getId());
        Long expiresIn = jwtTokenProvider.getAccessTokenExpirationInSeconds();

        log.info("Kakao login successful for user: {}", user.getEmail());

        return KakaoLoginResponse.of(user, accessToken, refreshToken, expiresIn);
    }
}