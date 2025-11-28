package io.github.beom.upload.infrastructure;

import io.github.beom.upload.domain.Upload;
import io.github.beom.upload.domain.UploadRepository;
import io.github.beom.upload.domain.UploadStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 도메인 리포지토리 포트를 구현하는 어댑터 (헥사고날 아키텍처)
 */
@Repository
@RequiredArgsConstructor
public class UploadRepositoryAdapter implements UploadRepository {
    private final UploadJpaRepository jpaRepository;

    @Override
    public Optional<Upload> findById(Long id) {
        return jpaRepository.findById(id)
            .map(UploadEntity::toDomain);
    }

    @Override
    public Upload save(Upload upload) {
        UploadEntity entity;

        if (upload.getId() == null) {
            // 신규 엔티티 생성
            entity = UploadEntity.from(upload);
        } else {
            // 기존 엔티티 업데이트
            entity = jpaRepository.findById(upload.getId())
                .orElseGet(() -> UploadEntity.from(upload));
            entity.updateFrom(upload);
        }

        UploadEntity saved = jpaRepository.save(entity);
        return saved.toDomain();
    }

    @Override
    public void delete(Upload upload) {
        jpaRepository.deleteById(upload.getId());
    }

    @Override
    public List<Upload> findByUserIdAndStatus(Long userId, UploadStatus status) {
        return jpaRepository.findByUserIdAndStatus(userId, status).stream()
            .map(UploadEntity::toDomain)
            .collect(Collectors.toList());
    }

    @Override
    public List<Upload> findByUserId(Long userId) {
        return jpaRepository.findByUserId(userId).stream()
            .map(UploadEntity::toDomain)
            .collect(Collectors.toList());
    }

    @Override
    public Optional<Upload> findByStoredFilename(String storedFilename) {
        return jpaRepository.findByStoredFilename(storedFilename)
            .map(UploadEntity::toDomain);
    }
}