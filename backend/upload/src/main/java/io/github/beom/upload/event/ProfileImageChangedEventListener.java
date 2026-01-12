package io.github.beom.upload.event;

import io.github.beom.core.event.ProfileImageChangedEvent;
import io.github.beom.upload.service.UploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * 프로필 이미지 변경 이벤트 리스너. 트랜잭션 커밋 후 이전 이미지를 soft delete.
 *
 * <p>주의: AFTER_COMMIT 시점에서는 DB 트랜잭션이 이미 종료된 상태이므로, 새로운 DB 작업을 위해서는 반드시 REQUIRES_NEW로 새 트랜잭션을 시작해야
 * 합니다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ProfileImageChangedEventListener {

  private final UploadService uploadService;

  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void handleProfileImageChanged(ProfileImageChangedEvent event) {
    Long oldImageId = event.oldProfileImageId();
    log.info("프로필 이미지 변경 이벤트 수신: oldImageId={}", oldImageId);

    try {
      uploadService.softDeleteByPublicId(oldImageId);
      log.info("이전 프로필 이미지 soft delete 완료: publicId={}", oldImageId);
    } catch (Exception e) {
      log.error("이전 프로필 이미지 soft delete 실패: publicId={}, error={}", oldImageId, e.getMessage());
    }
  }
}
