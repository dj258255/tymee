package io.github.beom.upload.repository;

import io.github.beom.upload.domain.FileType;
import io.github.beom.upload.entity.UploadEntity;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UploadJpaRepository extends JpaRepository<UploadEntity, Long> {

  Optional<UploadEntity> findByPublicId(Long publicId);

  @Query("SELECT u FROM UploadEntity u WHERE u.publicId = :publicId AND u.deletedAt IS NULL")
  Optional<UploadEntity> findActiveByPublicId(@Param("publicId") Long publicId);

  @Query("SELECT u FROM UploadEntity u WHERE u.uploaderId = :uploaderId AND u.deletedAt IS NULL")
  List<UploadEntity> findAllActiveByUploaderId(@Param("uploaderId") Long uploaderId);

  @Query(
      "SELECT u FROM UploadEntity u WHERE u.uploaderId = :uploaderId "
          + "AND u.fileType = :fileType AND u.deletedAt IS NULL")
  List<UploadEntity> findAllActiveByUploaderIdAndFileType(
      @Param("uploaderId") Long uploaderId, @Param("fileType") FileType fileType);

  boolean existsByPublicId(Long publicId);

  /** 삭제된 지 특정 기간이 지난 파일 조회 (Hard Delete 대상). */
  @Query("SELECT u FROM UploadEntity u WHERE u.deletedAt IS NOT NULL AND u.deletedAt < :before")
  List<UploadEntity> findDeletedBefore(@Param("before") LocalDateTime before);
}
