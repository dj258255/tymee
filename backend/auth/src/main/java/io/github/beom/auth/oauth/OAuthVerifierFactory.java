package io.github.beom.auth.oauth;

import io.github.beom.user.domain.vo.OAuthProvider;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

/** OAuthProvider에 맞는 Verifier를 반환하는 팩토리. */
@Component
public class OAuthVerifierFactory {

  private final Map<OAuthProvider, OAuthVerifier> verifiers;

  public OAuthVerifierFactory(List<OAuthVerifier> verifierList) {
    this.verifiers =
        verifierList.stream()
            .collect(Collectors.toMap(OAuthVerifier::getProvider, Function.identity()));
  }

  public OAuthVerifier getVerifier(OAuthProvider provider) {
    OAuthVerifier verifier = verifiers.get(provider);
    if (verifier == null) {
      throw new IllegalArgumentException("Unsupported OAuth provider: " + provider);
    }
    return verifier;
  }
}
