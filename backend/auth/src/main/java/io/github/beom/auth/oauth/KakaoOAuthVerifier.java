package io.github.beom.auth.oauth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.beom.user.domain.vo.OAuthProvider;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.springframework.stereotype.Component;

/** Kakao accessToken 검증기. Kakao API를 호출하여 토큰 검증 및 사용자 정보 조회. */
@Component
public class KakaoOAuthVerifier implements OAuthVerifier {

  private static final String KAKAO_USER_INFO_URL = "https://kapi.kakao.com/v2/user/me";

  private final HttpClient httpClient;
  private final ObjectMapper objectMapper;

  public KakaoOAuthVerifier() {
    this.httpClient = HttpClient.newHttpClient();
    this.objectMapper = new ObjectMapper();
  }

  @Override
  public OAuthProvider getProvider() {
    return OAuthProvider.KAKAO;
  }

  @Override
  public OAuthUserInfo verify(String accessToken) {
    try {
      HttpRequest request =
          HttpRequest.newBuilder()
              .uri(URI.create(KAKAO_USER_INFO_URL))
              .header("Authorization", "Bearer " + accessToken)
              .header("Content-Type", "application/x-www-form-urlencoded;charset=utf-8")
              .GET()
              .build();

      HttpResponse<String> response =
          httpClient.send(request, HttpResponse.BodyHandlers.ofString());

      if (response.statusCode() != 200) {
        throw new RuntimeException("Kakao API error: " + response.body());
      }

      JsonNode root = objectMapper.readTree(response.body());
      String id = root.get("id").asText();

      JsonNode kakaoAccount = root.get("kakao_account");
      String email = kakaoAccount.has("email") ? kakaoAccount.get("email").asText() : null;

      JsonNode profile = kakaoAccount.get("profile");
      String nickname = profile.has("nickname") ? profile.get("nickname").asText() : null;
      String profileImage =
          profile.has("profile_image_url") ? profile.get("profile_image_url").asText() : null;

      return new OAuthUserInfo(OAuthProvider.KAKAO, id, email, nickname, profileImage);
    } catch (Exception e) {
      throw new RuntimeException("Kakao token verification failed", e);
    }
  }
}
