package io.github.beom.upload.deleteupload;

import io.github.beom.core.exception.BusinessException;
import io.github.beom.core.exception.ErrorCode;
import io.github.beom.upload.domain.Upload;
import io.github.beom.upload.domain.UploadRepository;
import io.github.beom.upload.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 파일 삭제 핸들러 (Command Handler)
 */
@Service
@RequiredArgsConstructor
public class DeleteUploadHandler {
    private static final Logger log = LogManager.getLogger(DeleteUploadHandler.class);
    private final UploadRepository uploadRepository;
    private final FileStorageService fileStorageService;

    /**
     * 파일 삭제 처리
     * - 소프트 삭제: 데이터베이스에서 상태만 변경
     * - 하드 삭제: 실제 파일도 삭제
     */
    @Transactional
    public void handle(Long uploadId, Long userId) {
        // 1. 업로드 메타데이터 조회
        Upload upload = uploadRepository.findById(uploadId)
            .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND, "파일을 찾을 수 없습니다"));

        // 2. 파일 소유자 검증
        if (!upload.isOwnedBy(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "파일을 삭제할 권한이 없습니다");
        }

        // 3. 이미 삭제된 파일인지 확인
        if (upload.isDeleted()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE, "이미 삭제된 파일입니다");
        }

        // 4. 소프트 삭제: 상태만 변경
        upload.markAsDeleted();
        uploadRepository.save(upload);

        // 5. 하드 삭제: 실제 파일 삭제
        try {
            fileStorageService.delete(upload.getStoredFilename());
            log.info("파일 삭제 완료 - userId: {}, filename: {}", userId, upload.getOriginalFilename());
        } catch (Exception e) {
            log.error("물리적 파일 삭제 실패 - uploadId: {}, 메타데이터는 삭제됨", uploadId, e);
            // 물리적 파일 삭제 실패해도 메타데이터는 이미 삭제 상태로 변경됨
        }
    }
}