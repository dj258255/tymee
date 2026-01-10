package io.github.beom.upload.service;

import io.github.beom.upload.domain.FileType;
import io.github.beom.upload.domain.UploadCategory;
import java.time.Duration;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

/** Cloudflare R2 스토리지 서비스. Presigned URL 생성 및 파일 관리. */
@Service
@RequiredArgsConstructor
public class R2StorageService {

  private static final Duration UPLOAD_URL_EXPIRATION = Duration.ofMinutes(15);
  private static final Duration DOWNLOAD_URL_EXPIRATION = Duration.ofHours(1);

  private final S3Client s3Client;
  private final S3Presigner s3Presigner;

  @Value("${cloudflare.r2.bucket-name}")
  private String bucketName;

  @Value("${cloudflare.r2.path-prefix:local}")
  private String pathPrefix;

  @Value("${cloudflare.r2.public-url:}")
  private String publicUrl;

  /**
   * 업로드용 Presigned URL 생성.
   *
   * @param category 업로드 용도
   * @param fileType 파일 타입
   * @param mimeType MIME 타입
   * @param originalFileName 원본 파일명
   * @return Presigned URL 정보
   */
  public PresignedUrlResult generateUploadUrl(
      UploadCategory category, FileType fileType, String mimeType, String originalFileName) {
    String storedPath = generateStoredPath(category, fileType, originalFileName);

    PutObjectPresignRequest presignRequest =
        PutObjectPresignRequest.builder()
            .signatureDuration(UPLOAD_URL_EXPIRATION)
            .putObjectRequest(req -> req.bucket(bucketName).key(storedPath).contentType(mimeType))
            .build();

    PresignedPutObjectRequest presignedRequest = s3Presigner.presignPutObject(presignRequest);

    return new PresignedUrlResult(
        presignedRequest.url().toString(), storedPath, UPLOAD_URL_EXPIRATION.toSeconds());
  }

  /**
   * 다운로드용 Presigned URL 생성.
   *
   * @param storedPath 저장 경로
   * @return Presigned URL
   */
  public String generateDownloadUrl(String storedPath) {
    if (publicUrl != null && !publicUrl.isBlank()) {
      return publicUrl + "/" + storedPath;
    }

    GetObjectPresignRequest presignRequest =
        GetObjectPresignRequest.builder()
            .signatureDuration(DOWNLOAD_URL_EXPIRATION)
            .getObjectRequest(req -> req.bucket(bucketName).key(storedPath))
            .build();

    PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
    return presignedRequest.url().toString();
  }

  /**
   * 파일 메타데이터 조회.
   *
   * @param storedPath 저장 경로
   * @return 파일 크기 (bytes)
   */
  public long getFileSize(String storedPath) {
    HeadObjectRequest headRequest =
        HeadObjectRequest.builder().bucket(bucketName).key(storedPath).build();

    HeadObjectResponse response = s3Client.headObject(headRequest);
    return response.contentLength();
  }

  /**
   * 파일 존재 여부 확인.
   *
   * @param storedPath 저장 경로
   * @return 존재 여부
   */
  public boolean fileExists(String storedPath) {
    try {
      HeadObjectRequest headRequest =
          HeadObjectRequest.builder().bucket(bucketName).key(storedPath).build();
      s3Client.headObject(headRequest);
      return true;
    } catch (Exception e) {
      return false;
    }
  }

  /**
   * 파일 삭제.
   *
   * @param storedPath 저장 경로
   */
  public void deleteFile(String storedPath) {
    DeleteObjectRequest deleteRequest =
        DeleteObjectRequest.builder().bucket(bucketName).key(storedPath).build();

    s3Client.deleteObject(deleteRequest);
  }

  private String generateStoredPath(
      UploadCategory category, FileType fileType, String originalFileName) {
    String extension = extractExtension(originalFileName);
    String uuid = UUID.randomUUID().toString();
    // 구조: {env}/{category}/{fileType}s/{uuid}.{ext}
    // 예: prod/profiles/images/abc-123.jpg, staging/posts/videos/def-456.mp4
    return pathPrefix
        + "/"
        + category.getPath()
        + "/"
        + fileType.getCode()
        + "s/"
        + uuid
        + extension;
  }

  private String extractExtension(String fileName) {
    if (fileName == null || !fileName.contains(".")) {
      return "";
    }
    return fileName.substring(fileName.lastIndexOf("."));
  }

  public record PresignedUrlResult(String url, String storedPath, long expiresInSeconds) {}
}
