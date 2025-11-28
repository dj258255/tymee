package io.github.beom.upload.domain;

import io.github.beom.domain.repository.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Upload 리포지토리 포트 (Clean Architecture)
 */
public interface UploadRepository extends Repository<Upload, Long> {

    /**
     * 사용자 ID로 업로드 목록 조회 (활성 상태만)
     */
    List<Upload> findByUserIdAndStatus(Long userId, UploadStatus status);

    /**
     * 사용자 ID로 모든 업로드 조회
     */
    List<Upload> findByUserId(Long userId);

    /**
     * 저장 파일명으로 업로드 조회
     */
    Optional<Upload> findByStoredFilename(String storedFilename);
}