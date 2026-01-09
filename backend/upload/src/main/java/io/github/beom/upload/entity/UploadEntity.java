package io.github.beom.upload.entity;

import io.github.beom.upload.domain.FileType;
import io.github.beom.upload.domain.Upload;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
    name = "uploads",
    indexes = {
      @Index(name = "idx_uploads_uploader", columnList = "uploader_id"),
      @Index(name = "idx_uploads_type", columnList = "file_type")
    })
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class UploadEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "public_id", nullable = false, unique = true)
  private Long publicId;

  @Column(name = "uploader_id", nullable = false)
  private Long uploaderId;

  @Enumerated(EnumType.STRING)
  @Column(name = "file_type", nullable = false, length = 20)
  private FileType fileType;

  @Column(name = "mime_type", nullable = false, length = 100)
  private String mimeType;

  @Column(name = "original_name", nullable = false, length = 255)
  private String originalName;

  @Column(name = "stored_path", nullable = false, length = 500)
  private String storedPath;

  @Column(name = "file_size", nullable = false)
  private Long fileSize;

  @Column(name = "duration")
  private Integer duration;

  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "deleted_at")
  private LocalDateTime deletedAt;

  @PrePersist
  protected void onCreate() {
    this.createdAt = LocalDateTime.now();
  }

  public static UploadEntity from(Upload upload) {
    return UploadEntity.builder()
        .id(upload.getId())
        .publicId(upload.getPublicId())
        .uploaderId(upload.getUploaderId())
        .fileType(upload.getFileType())
        .mimeType(upload.getMimeType())
        .originalName(upload.getOriginalName())
        .storedPath(upload.getStoredPath())
        .fileSize(upload.getFileSize())
        .duration(upload.getDuration())
        .createdAt(upload.getCreatedAt())
        .deletedAt(upload.getDeletedAt())
        .build();
  }

  public Upload toDomain() {
    return Upload.builder()
        .id(this.id)
        .publicId(this.publicId)
        .uploaderId(this.uploaderId)
        .fileType(this.fileType)
        .mimeType(this.mimeType)
        .originalName(this.originalName)
        .storedPath(this.storedPath)
        .fileSize(this.fileSize)
        .duration(this.duration)
        .createdAt(this.createdAt)
        .deletedAt(this.deletedAt)
        .build();
  }
}
