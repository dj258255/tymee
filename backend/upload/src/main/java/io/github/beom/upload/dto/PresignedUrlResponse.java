package io.github.beom.upload.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Presigned URL 발급 응답")
public record PresignedUrlResponse(
    @Schema(description = "업로드용 Presigned URL") String uploadUrl,
    @Schema(description = "파일 Public ID (업로드 완료 시 사용)") Long publicId,
    @Schema(description = "저장 경로") String storedPath,
    @Schema(description = "URL 만료 시간 (초)") long expiresInSeconds) {}
