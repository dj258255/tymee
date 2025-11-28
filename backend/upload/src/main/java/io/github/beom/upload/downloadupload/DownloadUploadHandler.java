package io.github.beom.upload.downloadupload;

import io.github.beom.common.exception.BusinessException;
import io.github.beom.common.exception.ErrorCode;
import io.github.beom.upload.domain.Upload;
import io.github.beom.upload.domain.UploadRepository;
import io.github.beom.upload.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Path;

/**
 * 파일 다운로드 핸들러 (Query Handler)
 */
@Service
@RequiredArgsConstructor
public class DownloadUploadHandler {
    private static final Logger log = LogManager.getLogger(DownloadUploadHandler.class);
    private final UploadRepository uploadRepository;
    private final FileStorageService fileStorageService;

    /**
     * 파일 다운로드 처리
     * - 파일 소유자 검증
     * - 파일 상태 검증
     * - 파일 리소스 반환
     */
    @Transactional(readOnly = true)
    public FileResource handle(Long uploadId, Long userId) {
        // 1. 업로드 메타데이터 조회
        Upload upload = uploadRepository.findById(uploadId)
            .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND, "파일을 찾을 수 없습니다"));

        // 2. 파일 소유자 검증
        if (!upload.isOwnedBy(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "파일에 접근할 권한이 없습니다");
        }

        // 3. 파일 상태 검증
        if (upload.isDeleted()) {
            throw new BusinessException(ErrorCode.ENTITY_NOT_FOUND, "삭제된 파일입니다");
        }

        // 4. 파일 로드
        try {
            Path filePath = fileStorageService.load(upload.getStoredFilename());
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR, "파일을 읽을 수 없습니다");
            }

            log.info("파일 다운로드 - userId: {}, filename: {}", userId, upload.getOriginalFilename());

            return new FileResource(resource, upload.getOriginalFilename(), upload.getContentType());

        } catch (Exception e) {
            log.error("파일 다운로드 실패 - uploadId: {}", uploadId, e);
            throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR, "파일 다운로드에 실패했습니다");
        }
    }
}