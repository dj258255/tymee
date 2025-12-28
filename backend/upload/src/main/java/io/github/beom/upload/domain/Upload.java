package io.github.beom.upload.domain;

import io.github.beom.core.domain.AggregateRoot;
import lombok.Getter;

import java.time.Instant;

/**
 * Upload 애그리게이트 루트 (DDD)
 * 파일 메타데이터를 관리하는 도메인 모델
 */
@Getter
public class Upload extends AggregateRoot<Long> {
    private Long userId;                // 업로드한 사용자 ID
    private String originalFilename;    // 원본 파일명
    private String storedFilename;      // 저장된 파일명 (UUID)
    private String contentType;         // 파일 MIME 타입
    private Long fileSize;              // 파일 크기 (bytes)
    private String storagePath;         // 저장 경로
    private UploadStatus status;        // 업로드 상태
    private Instant uploadedAt;         // 업로드 일시

    private Upload(
        Long id,
        Long userId,
        String originalFilename,
        String storedFilename,
        String contentType,
        Long fileSize,
        String storagePath,
        UploadStatus status,
        Instant uploadedAt
    ) {
        super(id);
        this.userId = userId;
        this.originalFilename = originalFilename;
        this.storedFilename = storedFilename;
        this.contentType = contentType;
        this.fileSize = fileSize;
        this.storagePath = storagePath;
        this.status = status;
        this.uploadedAt = uploadedAt;
    }

    /**
     * 신규 업로드 생성
     */
    public static Upload create(
        Long userId,
        String originalFilename,
        String storedFilename,
        String contentType,
        Long fileSize,
        String storagePath
    ) {
        validateUserId(userId);
        validateOriginalFilename(originalFilename);
        validateStoredFilename(storedFilename);
        validateContentType(contentType);
        validateFileSize(fileSize);
        validateStoragePath(storagePath);

        return new Upload(
            null,
            userId,
            originalFilename,
            storedFilename,
            contentType,
            fileSize,
            storagePath,
            UploadStatus.ACTIVE,
            Instant.now()
        );
    }

    /**
     * 기존 업로드 재구성 (Repository에서 조회 시 사용)
     */
    public static Upload reconstruct(
        Long id,
        Long userId,
        String originalFilename,
        String storedFilename,
        String contentType,
        Long fileSize,
        String storagePath,
        UploadStatus status,
        Instant uploadedAt
    ) {
        return new Upload(
            id,
            userId,
            originalFilename,
            storedFilename,
            contentType,
            fileSize,
            storagePath,
            status,
            uploadedAt
        );
    }

    /**
     * 파일 삭제 (소프트 삭제)
     */
    public void markAsDeleted() {
        this.status = UploadStatus.DELETED;
    }

    /**
     * 파일이 활성 상태인지 확인
     */
    public boolean isActive() {
        return this.status == UploadStatus.ACTIVE;
    }

    /**
     * 파일이 삭제된 상태인지 확인
     */
    public boolean isDeleted() {
        return this.status == UploadStatus.DELETED;
    }

    /**
     * 사용자가 이 파일의 소유자인지 확인
     */
    public boolean isOwnedBy(Long userId) {
        return this.userId.equals(userId);
    }

    // ========== Validation Methods ==========

    private static void validateUserId(Long userId) {
        if (userId == null || userId <= 0) {
            throw new IllegalArgumentException("유효한 사용자 ID가 필요합니다");
        }
    }

    private static void validateOriginalFilename(String originalFilename) {
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new IllegalArgumentException("원본 파일명은 필수입니다");
        }
        if (originalFilename.length() > 255) {
            throw new IllegalArgumentException("파일명이 너무 깁니다 (최대 255자)");
        }
    }

    private static void validateStoredFilename(String storedFilename) {
        if (storedFilename == null || storedFilename.isBlank()) {
            throw new IllegalArgumentException("저장 파일명은 필수입니다");
        }
    }

    private static void validateContentType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            throw new IllegalArgumentException("파일 타입은 필수입니다");
        }
    }

    private static void validateFileSize(Long fileSize) {
        if (fileSize == null || fileSize <= 0) {
            throw new IllegalArgumentException("유효한 파일 크기가 필요합니다");
        }
        // 최대 파일 크기: 100MB
        long maxFileSize = 100 * 1024 * 1024;
        if (fileSize > maxFileSize) {
            throw new IllegalArgumentException("파일 크기가 너무 큽니다 (최대 100MB)");
        }
    }

    private static void validateStoragePath(String storagePath) {
        if (storagePath == null || storagePath.isBlank()) {
            throw new IllegalArgumentException("저장 경로는 필수입니다");
        }
    }
}