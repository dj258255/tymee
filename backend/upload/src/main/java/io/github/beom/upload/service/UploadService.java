package io.github.beom.upload.service;

import io.github.beom.core.exception.BusinessException;
import io.github.beom.core.exception.EntityNotFoundException;
import io.github.beom.core.exception.ErrorCode;
import io.github.beom.core.util.SnowflakeIdGenerator;
import io.github.beom.upload.domain.FileType;
import io.github.beom.upload.domain.Upload;
import io.github.beom.upload.dto.PresignedUrlRequest;
import io.github.beom.upload.dto.PresignedUrlResponse;
import io.github.beom.upload.dto.UploadCompleteRequest;
import io.github.beom.upload.dto.UploadResponse;
import io.github.beom.upload.repository.UploadRepository;
import io.github.beom.upload.service.R2StorageService.PresignedUrlResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UploadService {

  private final UploadRepository uploadRepository;
  private final R2StorageService r2StorageService;
  private final FileValidator fileValidator;
  private final SnowflakeIdGenerator snowflakeIdGenerator;
  private final ImageResizeService imageResizeService;

  /**
   * Presigned URL 발급.
   *
   * @param request 요청 정보
   * @return Presigned URL 응답
   */
  public PresignedUrlResponse generatePresignedUrl(PresignedUrlRequest request) {
    fileValidator.validate(request.mimeType(), request.fileSize());

    FileType fileType = FileType.fromMimeType(request.mimeType());
    PresignedUrlResult result =
        r2StorageService.generateUploadUrl(
            request.category(), fileType, request.mimeType(), request.fileName());

    long publicId = snowflakeIdGenerator.nextId();

    return new PresignedUrlResponse(
        result.url(), publicId, result.storedPath(), result.expiresInSeconds());
  }

  /**
   * 업로드 완료 처리.
   *
   * @param uploaderId 업로더 ID
   * @param request 요청 정보
   * @return 업로드 응답
   */
  @Transactional
  public UploadResponse completeUpload(Long uploaderId, UploadCompleteRequest request) {
    if (!r2StorageService.fileExists(request.storedPath())) {
      throw new BusinessException(ErrorCode.FILE_NOT_FOUND);
    }

    Upload upload =
        Upload.create(
            request.publicId(),
            uploaderId,
            request.mimeType(),
            request.originalName(),
            request.storedPath(),
            request.fileSize(),
            request.duration());

    Upload savedUpload = uploadRepository.save(upload);

    if (savedUpload.isImage()) {
      imageResizeService.createThumbnailAsync(savedUpload);
    }

    String url = r2StorageService.generateDownloadUrl(savedUpload.getStoredPath());
    String thumbnailUrl = savedUpload.isImage() ? getThumbnailUrl(savedUpload) : null;

    return UploadResponse.from(savedUpload, url, thumbnailUrl);
  }

  /**
   * 파일 조회.
   *
   * @param publicId 파일 Public ID
   * @return 업로드 응답
   */
  @Transactional(readOnly = true)
  public UploadResponse getUpload(Long publicId) {
    Upload upload =
        uploadRepository
            .findActiveByPublicId(publicId)
            .orElseThrow(() -> new EntityNotFoundException(ErrorCode.FILE_NOT_FOUND));

    String url = r2StorageService.generateDownloadUrl(upload.getStoredPath());
    String thumbnailUrl = upload.isImage() ? getThumbnailUrl(upload) : null;

    return UploadResponse.from(upload, url, thumbnailUrl);
  }

  /**
   * 파일 삭제 (Soft Delete).
   *
   * @param uploaderId 업로더 ID
   * @param publicId 파일 Public ID
   */
  @Transactional
  public void deleteUpload(Long uploaderId, Long publicId) {
    Upload upload =
        uploadRepository
            .findActiveByPublicId(publicId)
            .orElseThrow(() -> new EntityNotFoundException(ErrorCode.FILE_NOT_FOUND));

    if (!upload.getUploaderId().equals(uploaderId)) {
      throw new BusinessException(ErrorCode.ACCESS_DENIED);
    }

    upload.delete();
    uploadRepository.save(upload);
  }

  private String getThumbnailUrl(Upload upload) {
    String thumbnailPath = imageResizeService.getThumbnailPath(upload.getStoredPath());
    if (r2StorageService.fileExists(thumbnailPath)) {
      return r2StorageService.generateDownloadUrl(thumbnailPath);
    }
    return null;
  }
}
