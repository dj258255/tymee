package io.github.beom.upload.createupload;

import io.github.beom.upload.domain.Upload;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;

/**
 * 파일 업로드 응답 DTO
 */
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class CreateUploadResponse {
    private Long id;
    private String originalFilename;
    private String contentType;
    private Long fileSize;
    private Instant uploadedAt;

    public static CreateUploadResponse from(Upload upload) {
        return new CreateUploadResponse(
            upload.getId(),
            upload.getOriginalFilename(),
            upload.getContentType(),
            upload.getFileSize(),
            upload.getUploadedAt()
        );
    }
}