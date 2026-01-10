package io.github.beom.upload.config;

import java.net.URI;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

/** Cloudflare R2 설정. AWS SDK S3 호환 API 사용. */
@Configuration
public class R2Config {

  @Value("${cloudflare.r2.account-id}")
  private String accountId;

  @Value("${cloudflare.r2.access-key-id}")
  private String accessKeyId;

  @Value("${cloudflare.r2.secret-access-key}")
  private String secretAccessKey;

  @Bean
  public S3Client s3Client() {
    return S3Client.builder()
        .endpointOverride(URI.create("https://" + accountId + ".r2.cloudflarestorage.com"))
        .credentialsProvider(
            StaticCredentialsProvider.create(
                AwsBasicCredentials.create(accessKeyId, secretAccessKey)))
        .region(Region.of("auto"))
        .build();
  }

  @Bean
  public S3Presigner s3Presigner() {
    return S3Presigner.builder()
        .endpointOverride(URI.create("https://" + accountId + ".r2.cloudflarestorage.com"))
        .credentialsProvider(
            StaticCredentialsProvider.create(
                AwsBasicCredentials.create(accessKeyId, secretAccessKey)))
        .region(Region.of("auto"))
        .build();
  }
}
