package io.github.beom.auth.kakao;

import io.github.beom.core.exception.BusinessException;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * 카카오 OAuth API 연동 서비스
 */
@Service
public class KakaoAuthService {
    private static final Logger log = LogManager.getLogger(KakaoAuthService.class);
    private static final String KAKAO_USER_INFO_URL = "https://kapi.kakao.com/v2/user/me";
    private final RestTemplate restTemplate;

    public KakaoAuthService() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * 카카오 액세스 토큰으로 사용자 정보 조회
     *
     * @param accessToken 카카오 액세스 토큰
     * @return 카카오 사용자 정보
     */
    public KakaoUserInfo getUserInfo(String accessToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.add("Authorization", "Bearer " + accessToken);
            headers.add("Content-Type", "application/x-www-form-urlencoded;charset=utf-8");

            HttpEntity<String> request = new HttpEntity<>(headers);

            ResponseEntity<KakaoUserInfo> response = restTemplate.exchange(
                KAKAO_USER_INFO_URL,
                HttpMethod.GET,
                request,
                KakaoUserInfo.class
            );

            if (response.getBody() == null) {
                throw new BusinessException(io.github.beom.core.exception.ErrorCode.KAKAO_USER_INFO_FAILED);
            }

            log.info("카카오 사용자 정보 조회 성공 - ID: {}", response.getBody().getId());
            return response.getBody();

        } catch (Exception e) {
            log.error("카카오 사용자 정보 조회 실패", e);
            throw new BusinessException(io.github.beom.core.exception.ErrorCode.KAKAO_INVALID_TOKEN);
        }
    }
}