package io.github.beom.upload.scheduler;

import io.github.beom.upload.domain.Upload;
import io.github.beom.upload.repository.UploadRepository;
import io.github.beom.upload.service.R2StorageService;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** 고아 파일 정리 스케줄러. Soft Delete된 지 7일이 지난 파일을 R2에서 삭제하고 DB에서 Hard Delete. */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrphanFileCleanupScheduler {

  private static final int RETENTION_DAYS = 7;

  private final UploadRepository uploadRepository;
  private final R2StorageService r2StorageService;

  /** 매일 새벽 3시에 실행. */
  @Scheduled(cron = "0 0 3 * * *")
  @Transactional
  public void cleanupOrphanFiles() {
    LocalDateTime cutoffDate = LocalDateTime.now().minusDays(RETENTION_DAYS);
    List<Upload> expiredUploads = uploadRepository.findDeletedBefore(cutoffDate);

    if (expiredUploads.isEmpty()) {
      log.info("고아 파일 정리: 삭제 대상 없음");
      return;
    }

    log.info("고아 파일 정리 시작: {}건 대상", expiredUploads.size());

    int successCount = 0;
    int failCount = 0;

    for (Upload upload : expiredUploads) {
      try {
        // R2에서 파일 삭제
        r2StorageService.deleteFile(upload.getStoredPath());
        // DB에서 Hard Delete
        uploadRepository.delete(upload);
        successCount++;
        log.debug("파일 삭제 완료: publicId={}, path={}", upload.getPublicId(), upload.getStoredPath());
      } catch (Exception e) {
        failCount++;
        log.error(
            "파일 삭제 실패: publicId={}, path={}, error={}",
            upload.getPublicId(),
            upload.getStoredPath(),
            e.getMessage());
      }
    }

    log.info("고아 파일 정리 완료: 성공={}건, 실패={}건", successCount, failCount);
  }
}
