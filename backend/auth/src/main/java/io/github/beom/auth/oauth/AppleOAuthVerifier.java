package io.github.beom.auth.oauth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.beom.user.domain.vo.OAuthProvider;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import java.math.BigInteger;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.RSAPublicKeySpec;
import java.time.Duration;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Apple idToken 검증기. Apple 공개키로 JWT 서명 검증. */
@Component
public class AppleOAuthVerifier implements OAuthVerifier {

  private static final String APPLE_KEYS_URL = "https://appleid.apple.com/auth/keys";
  private static final Duration KEY_CACHE_DURATION = Duration.ofHours(24);

  private final String bundleId;
  private final HttpClient httpClient;
  private final ObjectMapper objectMapper;
  private final Map<String, PublicKey> keyCache = new ConcurrentHashMap<>();
  private long lastKeyFetchTime = 0;

  public AppleOAuthVerifier(@Value("${oauth.apple.bundle-id}") String bundleId) {
    this.bundleId = bundleId;
    this.httpClient = HttpClient.newHttpClient();
    this.objectMapper = new ObjectMapper();
  }

  @Override
  public OAuthProvider getProvider() {
    return OAuthProvider.APPLE;
  }

  @Override
  public OAuthUserInfo verify(String idToken) {
    try {
      // JWT 헤더에서 kid 추출
      String[] parts = idToken.split("\\.");
      String header = new String(Base64.getUrlDecoder().decode(parts[0]));
      JsonNode headerNode = objectMapper.readTree(header);
      String kid = headerNode.get("kid").asText();

      // Apple 공개키로 검증
      PublicKey publicKey = getApplePublicKey(kid);

      Claims claims =
          Jwts.parser()
              .verifyWith(publicKey)
              .requireAudience(bundleId)
              .requireIssuer("https://appleid.apple.com")
              .build()
              .parseSignedClaims(idToken)
              .getPayload();

      return new OAuthUserInfo(
          OAuthProvider.APPLE,
          claims.getSubject(),
          claims.get("email", String.class),
          null, // Apple은 이름을 첫 로그인에만 제공
          null);
    } catch (Exception e) {
      throw new RuntimeException("Apple token verification failed", e);
    }
  }

  private PublicKey getApplePublicKey(String kid) throws Exception {
    // 캐시 만료 체크
    if (System.currentTimeMillis() - lastKeyFetchTime > KEY_CACHE_DURATION.toMillis()) {
      keyCache.clear();
    }

    // 캐시에 있으면 반환
    if (keyCache.containsKey(kid)) {
      return keyCache.get(kid);
    }

    // Apple에서 공개키 가져오기
    HttpRequest request = HttpRequest.newBuilder().uri(URI.create(APPLE_KEYS_URL)).GET().build();

    HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    JsonNode keys = objectMapper.readTree(response.body()).get("keys");

    for (JsonNode key : keys) {
      if (kid.equals(key.get("kid").asText())) {
        PublicKey publicKey = createPublicKey(key);
        keyCache.put(kid, publicKey);
        lastKeyFetchTime = System.currentTimeMillis();
        return publicKey;
      }
    }

    throw new IllegalArgumentException("Apple public key not found for kid: " + kid);
  }

  private PublicKey createPublicKey(JsonNode key) throws Exception {
    String n = key.get("n").asText();
    String e = key.get("e").asText();

    byte[] nBytes = Base64.getUrlDecoder().decode(n);
    byte[] eBytes = Base64.getUrlDecoder().decode(e);

    BigInteger modulus = new BigInteger(1, nBytes);
    BigInteger exponent = new BigInteger(1, eBytes);

    RSAPublicKeySpec spec = new RSAPublicKeySpec(modulus, exponent);
    KeyFactory factory = KeyFactory.getInstance("RSA");
    return factory.generatePublic(spec);
  }
}
