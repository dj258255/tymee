package io.github.beom.upload.infrastructure;

import io.github.beom.upload.domain.UploadStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA 리포지토리 인터페이스
 */
public interface UploadJpaRepository extends JpaRepository<UploadEntity, Long> {
    List<UploadEntity> findByUserIdAndStatus(Long userId, UploadStatus status);
    List<UploadEntity> findByUserId(Long userId);
    Optional<UploadEntity> findByStoredFilename(String storedFilename);
}