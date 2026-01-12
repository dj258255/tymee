package io.github.beom.upload.repository;

import io.github.beom.upload.domain.FileType;
import io.github.beom.upload.domain.Upload;
import io.github.beom.upload.entity.UploadEntity;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class UploadRepository {

  private final UploadJpaRepository uploadJpaRepository;

  public Optional<Upload> findByPublicId(Long publicId) {
    return uploadJpaRepository.findByPublicId(publicId).map(UploadEntity::toDomain);
  }

  public Optional<Upload> findActiveByPublicId(Long publicId) {
    return uploadJpaRepository.findActiveByPublicId(publicId).map(UploadEntity::toDomain);
  }

  public List<Upload> findAllActiveByUploaderId(Long uploaderId) {
    return uploadJpaRepository.findAllActiveByUploaderId(uploaderId).stream()
        .map(UploadEntity::toDomain)
        .toList();
  }

  public List<Upload> findAllActiveByUploaderIdAndFileType(Long uploaderId, FileType fileType) {
    return uploadJpaRepository.findAllActiveByUploaderIdAndFileType(uploaderId, fileType).stream()
        .map(UploadEntity::toDomain)
        .toList();
  }

  /** 삭제된 지 특정 기간이 지난 파일 조회 (Hard Delete 대상). */
  public List<Upload> findDeletedBefore(LocalDateTime before) {
    return uploadJpaRepository.findDeletedBefore(before).stream()
        .map(UploadEntity::toDomain)
        .toList();
  }

  public boolean existsByPublicId(Long publicId) {
    return uploadJpaRepository.existsByPublicId(publicId);
  }

  public Upload save(Upload upload) {
    UploadEntity entity = UploadEntity.from(upload);
    UploadEntity savedEntity = uploadJpaRepository.save(entity);
    return savedEntity.toDomain();
  }

  public void delete(Upload upload) {
    uploadJpaRepository.deleteById(upload.getId());
  }
}
