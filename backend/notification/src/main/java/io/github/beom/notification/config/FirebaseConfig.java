package io.github.beom.notification.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Firebase Admin SDK 설정.
 *
 * <p>FCM 푸시 알림 발송을 위한 Firebase 초기화. Base64로 인코딩된 서비스 계정 JSON을 환경변수에서 읽는다.
 */
@Configuration
public class FirebaseConfig {

  @Value("${firebase.credentials-base64}")
  private String credentialsBase64;

  @Bean
  public FirebaseApp firebaseApp() throws IOException {
    if (FirebaseApp.getApps().isEmpty()) {
      byte[] decodedCredentials = Base64.getDecoder().decode(credentialsBase64);
      ByteArrayInputStream credentialsStream =
          new ByteArrayInputStream(
              new String(decodedCredentials, StandardCharsets.UTF_8).getBytes(StandardCharsets.UTF_8));

      FirebaseOptions options =
          FirebaseOptions.builder()
              .setCredentials(GoogleCredentials.fromStream(credentialsStream))
              .build();

      return FirebaseApp.initializeApp(options);
    }
    return FirebaseApp.getInstance();
  }

  @Bean
  public FirebaseMessaging firebaseMessaging(FirebaseApp firebaseApp) {
    return FirebaseMessaging.getInstance(firebaseApp);
  }
}
