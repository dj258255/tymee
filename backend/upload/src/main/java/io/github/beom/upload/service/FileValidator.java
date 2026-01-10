package io.github.beom.upload.service;

import io.github.beom.core.exception.BusinessException;
import io.github.beom.core.exception.ErrorCode;
import io.github.beom.upload.domain.FileType;
import java.util.Set;
import org.springframework.stereotype.Component;

/** 파일 유효성 검증. MIME 타입 및 파일 크기 제한. */
@Component
public class FileValidator {

  private static final long IMAGE_MAX_SIZE = 10 * 1024 * 1024; // 10MB
  private static final long VIDEO_MAX_SIZE = 100 * 1024 * 1024; // 100MB
  private static final long AUDIO_MAX_SIZE = 50 * 1024 * 1024; // 50MB

  private static final Set<String> ALLOWED_IMAGE_TYPES =
      Set.of("image/jpeg", "image/png", "image/gif", "image/webp", "image/heic", "image/heif");

  private static final Set<String> ALLOWED_VIDEO_TYPES =
      Set.of("video/mp4", "video/quicktime", "video/webm", "video/x-m4v");

  private static final Set<String> ALLOWED_AUDIO_TYPES =
      Set.of("audio/mpeg", "audio/mp4", "audio/aac", "audio/wav", "audio/x-m4a", "audio/m4a");

  /**
   * MIME 타입 검증.
   *
   * @param mimeType MIME 타입
   * @throws BusinessException 지원하지 않는 MIME 타입인 경우
   */
  public void validateMimeType(String mimeType) {
    if (!isAllowedMimeType(mimeType)) {
      throw new BusinessException(ErrorCode.UNSUPPORTED_FILE_TYPE);
    }
  }

  /**
   * 파일 크기 검증.
   *
   * @param mimeType MIME 타입
   * @param fileSize 파일 크기 (bytes)
   * @throws BusinessException 파일 크기 초과 시
   */
  public void validateFileSize(String mimeType, long fileSize) {
    FileType fileType = FileType.fromMimeType(mimeType);
    long maxSize = getMaxFileSize(fileType);

    if (fileSize > maxSize) {
      throw new BusinessException(ErrorCode.FILE_SIZE_EXCEEDED);
    }
  }

  /**
   * 파일 전체 검증 (MIME 타입 + 파일 크기).
   *
   * @param mimeType MIME 타입
   * @param fileSize 파일 크기 (bytes)
   */
  public void validate(String mimeType, long fileSize) {
    validateMimeType(mimeType);
    validateFileSize(mimeType, fileSize);
  }

  private boolean isAllowedMimeType(String mimeType) {
    return ALLOWED_IMAGE_TYPES.contains(mimeType)
        || ALLOWED_VIDEO_TYPES.contains(mimeType)
        || ALLOWED_AUDIO_TYPES.contains(mimeType);
  }

  private long getMaxFileSize(FileType fileType) {
    return switch (fileType) {
      case IMAGE -> IMAGE_MAX_SIZE;
      case VIDEO -> VIDEO_MAX_SIZE;
      case AUDIO -> AUDIO_MAX_SIZE;
    };
  }
}
