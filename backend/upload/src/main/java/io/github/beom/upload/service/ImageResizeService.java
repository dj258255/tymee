package io.github.beom.upload.service;

import io.github.beom.upload.domain.Upload;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import javax.imageio.ImageIO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

/** 이미지 리사이징 서비스. 썸네일 생성. */
@Service
@RequiredArgsConstructor
@Slf4j
public class ImageResizeService {

  private static final int THUMBNAIL_WIDTH = 200;
  private static final int THUMBNAIL_HEIGHT = 200;
  private static final String THUMBNAIL_SUFFIX = "_thumb";

  private final S3Client s3Client;

  @org.springframework.beans.factory.annotation.Value("${cloudflare.r2.bucket-name}")
  private String bucketName;

  /**
   * 비동기로 썸네일 생성.
   *
   * @param upload 업로드 정보
   */
  @Async
  public void createThumbnailAsync(Upload upload) {
    try {
      createThumbnail(upload.getStoredPath(), upload.getMimeType());
      log.info("썸네일 생성 완료: {}", upload.getPublicId());
    } catch (Exception e) {
      log.error("썸네일 생성 실패: {}", upload.getPublicId(), e);
    }
  }

  /**
   * 썸네일 생성.
   *
   * @param storedPath 원본 저장 경로
   * @param mimeType MIME 타입
   */
  public void createThumbnail(String storedPath, String mimeType) throws IOException {
    byte[] originalImage = downloadImage(storedPath);
    byte[] thumbnailImage = resizeImage(originalImage, mimeType);
    String thumbnailPath = getThumbnailPath(storedPath);
    uploadThumbnail(thumbnailPath, thumbnailImage, mimeType);
  }

  /**
   * 썸네일 경로 생성.
   *
   * @param originalPath 원본 경로
   * @return 썸네일 경로
   */
  public String getThumbnailPath(String originalPath) {
    int dotIndex = originalPath.lastIndexOf(".");
    if (dotIndex == -1) {
      return originalPath + THUMBNAIL_SUFFIX;
    }
    return originalPath.substring(0, dotIndex)
        + THUMBNAIL_SUFFIX
        + originalPath.substring(dotIndex);
  }

  private byte[] downloadImage(String storedPath) throws IOException {
    GetObjectRequest getRequest =
        GetObjectRequest.builder().bucket(bucketName).key(storedPath).build();

    try (ResponseInputStream<GetObjectResponse> response = s3Client.getObject(getRequest)) {
      return response.readAllBytes();
    }
  }

  private byte[] resizeImage(byte[] imageData, String mimeType) throws IOException {
    try (InputStream inputStream = new ByteArrayInputStream(imageData);
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

      BufferedImage originalImage = ImageIO.read(inputStream);
      if (originalImage == null) {
        throw new IOException("이미지를 읽을 수 없습니다");
      }

      String formatName = getFormatName(mimeType);

      Thumbnails.of(originalImage)
          .size(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT)
          .keepAspectRatio(true)
          .outputFormat(formatName)
          .toOutputStream(outputStream);

      return outputStream.toByteArray();
    }
  }

  private void uploadThumbnail(String thumbnailPath, byte[] imageData, String mimeType) {
    PutObjectRequest putRequest =
        PutObjectRequest.builder()
            .bucket(bucketName)
            .key(thumbnailPath)
            .contentType(mimeType)
            .contentLength((long) imageData.length)
            .build();

    s3Client.putObject(putRequest, RequestBody.fromBytes(imageData));
  }

  private String getFormatName(String mimeType) {
    return switch (mimeType) {
      case "image/png" -> "png";
      case "image/gif" -> "gif";
      case "image/webp" -> "webp";
      default -> "jpeg";
    };
  }
}
