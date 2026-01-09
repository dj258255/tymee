package io.github.beom.upload.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

@Schema(description = "Presigned URL 발급 요청")
public record PresignedUrlRequest(
    @Schema(description = "원본 파일명", example = "profile.jpg") @NotBlank(message = "파일명은 필수입니다")
        String fileName,
    @Schema(description = "MIME 타입", example = "image/jpeg") @NotBlank(message = "MIME 타입은 필수입니다")
        String mimeType,
    @Schema(description = "파일 크기 (bytes)", example = "1048576")
        @NotNull(message = "파일 크기는 필수입니다")
        @Positive(message = "파일 크기는 양수여야 합니다")
        Long fileSize) {}
