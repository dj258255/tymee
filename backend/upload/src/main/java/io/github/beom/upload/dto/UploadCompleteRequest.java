package io.github.beom.upload.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Schema(description = "업로드 완료 요청")
public record UploadCompleteRequest(
    @Schema(description = "파일 Public ID") @NotNull(message = "Public ID는 필수입니다") Long publicId,
    @Schema(description = "저장 경로") @NotBlank(message = "저장 경로는 필수입니다") String storedPath,
    @Schema(description = "원본 파일명") @NotBlank(message = "파일명은 필수입니다") String originalName,
    @Schema(description = "MIME 타입") @NotBlank(message = "MIME 타입은 필수입니다") String mimeType,
    @Schema(description = "파일 크기 (bytes)") @NotNull(message = "파일 크기는 필수입니다") Long fileSize,
    @Schema(description = "미디어 재생 시간 (초) - 오디오/비디오용", nullable = true) Integer duration) {}
