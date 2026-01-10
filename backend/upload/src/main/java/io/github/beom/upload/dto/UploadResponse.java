package io.github.beom.upload.dto;

import io.github.beom.upload.domain.FileType;
import io.github.beom.upload.domain.Upload;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;

@Schema(description = "업로드 파일 응답")
public record UploadResponse(
    @Schema(description = "파일 Public ID") Long publicId,
    @Schema(description = "파일 타입") FileType fileType,
    @Schema(description = "MIME 타입") String mimeType,
    @Schema(description = "원본 파일명") String originalName,
    @Schema(description = "파일 크기 (bytes)") Long fileSize,
    @Schema(description = "미디어 재생 시간 (초)") Integer duration,
    @Schema(description = "파일 URL") String url,
    @Schema(description = "썸네일 URL (이미지만)") String thumbnailUrl,
    @Schema(description = "생성일시") LocalDateTime createdAt) {

  public static UploadResponse from(Upload upload, String url, String thumbnailUrl) {
    return new UploadResponse(
        upload.getPublicId(),
        upload.getFileType(),
        upload.getMimeType(),
        upload.getOriginalName(),
        upload.getFileSize(),
        upload.getDuration(),
        url,
        thumbnailUrl,
        upload.getCreatedAt());
  }
}
