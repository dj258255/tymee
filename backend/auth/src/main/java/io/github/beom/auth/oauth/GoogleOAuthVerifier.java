package io.github.beom.auth.oauth;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import io.github.beom.user.domain.vo.OAuthProvider;
import java.util.Collections;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Google idToken 검증기. Google API Client를 사용하여 토큰 서명 검증. */
@Component
public class GoogleOAuthVerifier implements OAuthVerifier {

  private final GoogleIdTokenVerifier verifier;

  public GoogleOAuthVerifier(@Value("${oauth.google.client-id}") String clientId) {
    this.verifier =
        new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
            .setAudience(Collections.singletonList(clientId))
            .build();
  }

  @Override
  public OAuthProvider getProvider() {
    return OAuthProvider.GOOGLE;
  }

  @Override
  public OAuthUserInfo verify(String idToken) {
    try {
      GoogleIdToken googleIdToken = verifier.verify(idToken);
      if (googleIdToken == null) {
        throw new IllegalArgumentException("Invalid Google ID token");
      }

      GoogleIdToken.Payload payload = googleIdToken.getPayload();

      return new OAuthUserInfo(
          OAuthProvider.GOOGLE,
          payload.getSubject(),
          payload.getEmail(),
          (String) payload.get("name"),
          (String) payload.get("picture"));
    } catch (Exception e) {
      throw new RuntimeException("Google token verification failed", e);
    }
  }
}
