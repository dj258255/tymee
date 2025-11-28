package io.github.beom.upload.listuploads;

import io.github.beom.upload.domain.Upload;
import io.github.beom.upload.domain.UploadRepository;
import io.github.beom.upload.domain.UploadStatus;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 업로드 목록 조회 핸들러 (Query Handler)
 */
@Service
@RequiredArgsConstructor
public class ListUploadsHandler {
    private static final Logger log = LogManager.getLogger(ListUploadsHandler.class);
    private final UploadRepository uploadRepository;

    /**
     * 사용자의 업로드 파일 목록 조회 (활성 상태만)
     */
    @Transactional(readOnly = true)
    public ListUploadsResponse handle(Long userId) {
        List<Upload> uploads = uploadRepository.findByUserIdAndStatus(userId, UploadStatus.ACTIVE);

        log.info("사용자 업로드 목록 조회 완료 - userId: {}, count: {}", userId, uploads.size());

        return ListUploadsResponse.from(uploads);
    }
}