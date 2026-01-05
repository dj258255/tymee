package io.github.beom.upload.domain;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
public class Upload {

  private final Long id;
  private final Long publicId;
  private final Long uploaderId;
  private final FileType fileType;
  private final String mimeType;
  private final String originalName;
  private final String storedPath;
  private final Long fileSize;
  private final Integer duration;
  private final LocalDateTime createdAt;
  private LocalDateTime deletedAt;

  @Builder
  private Upload(
      Long id,
      Long publicId,
      Long uploaderId,
      FileType fileType,
      String mimeType,
      String originalName,
      String storedPath,
      Long fileSize,
      Integer duration,
      LocalDateTime createdAt,
      LocalDateTime deletedAt) {
    this.id = id;
    this.publicId = publicId;
    this.uploaderId = uploaderId;
    this.fileType = fileType;
    this.mimeType = mimeType;
    this.originalName = originalName;
    this.storedPath = storedPath;
    this.fileSize = fileSize;
    this.duration = duration;
    this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
    this.deletedAt = deletedAt;
  }

  public static Upload create(
      Long publicId,
      Long uploaderId,
      String mimeType,
      String originalName,
      String storedPath,
      Long fileSize,
      Integer duration) {
    return Upload.builder()
        .publicId(publicId)
        .uploaderId(uploaderId)
        .fileType(FileType.fromMimeType(mimeType))
        .mimeType(mimeType)
        .originalName(originalName)
        .storedPath(storedPath)
        .fileSize(fileSize)
        .duration(duration)
        .build();
  }

  public void delete() {
    if (isDeleted()) {
      throw new IllegalStateException("이미 삭제된 파일입니다");
    }
    this.deletedAt = LocalDateTime.now();
  }

  public boolean isDeleted() {
    return this.deletedAt != null;
  }

  public boolean isImage() {
    return this.fileType == FileType.IMAGE;
  }

  public boolean isVideo() {
    return this.fileType == FileType.VIDEO;
  }

  public boolean isAudio() {
    return this.fileType == FileType.AUDIO;
  }

  public boolean hasMediaDuration() {
    return this.duration != null && this.duration > 0;
  }
}
