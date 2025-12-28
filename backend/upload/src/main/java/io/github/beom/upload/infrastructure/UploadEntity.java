package io.github.beom.upload.infrastructure;

import io.github.beom.core.persistence.BaseEntity;
import io.github.beom.upload.domain.Upload;
import io.github.beom.upload.domain.UploadStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Upload JPA 엔티티 (인프라 레이어 어댑터)
 */
@Entity
@Table(name = "uploads", indexes = {
    @Index(name = "idx_user_id", columnList = "user_id"),
    @Index(name = "idx_user_id_status", columnList = "user_id,status"),
    @Index(name = "idx_stored_filename", columnList = "stored_filename")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class UploadEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "original_filename", nullable = false, length = 255)
    private String originalFilename;

    @Column(name = "stored_filename", nullable = false, unique = true, length = 255)
    private String storedFilename;

    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "storage_path", nullable = false, length = 500)
    private String storagePath;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private UploadStatus status;

    @Column(name = "uploaded_at", nullable = false)
    private Instant uploadedAt;

    /**
     * 도메인 모델로부터 엔티티 생성
     */
    public static UploadEntity from(Upload upload) {
        return UploadEntity.builder()
            .id(upload.getId())
            .userId(upload.getUserId())
            .originalFilename(upload.getOriginalFilename())
            .storedFilename(upload.getStoredFilename())
            .contentType(upload.getContentType())
            .fileSize(upload.getFileSize())
            .storagePath(upload.getStoragePath())
            .status(upload.getStatus())
            .uploadedAt(upload.getUploadedAt())
            .build();
    }

    /**
     * 엔티티를 도메인 모델로 변환
     */
    public Upload toDomain() {
        return Upload.reconstruct(
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
     * 도메인 모델로부터 엔티티 업데이트
     */
    public void updateFrom(Upload upload) {
        this.userId = upload.getUserId();
        this.originalFilename = upload.getOriginalFilename();
        this.storedFilename = upload.getStoredFilename();
        this.contentType = upload.getContentType();
        this.fileSize = upload.getFileSize();
        this.storagePath = upload.getStoragePath();
        this.status = upload.getStatus();
        this.uploadedAt = upload.getUploadedAt();
    }
}