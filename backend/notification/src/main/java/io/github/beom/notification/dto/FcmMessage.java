package io.github.beom.notification.dto;

import java.util.Map;
import lombok.Builder;
import lombok.Getter;

/**
 * FCM 푸시 알림 메시지 DTO.
 *
 * <p>알림 제목, 내용, 데이터 페이로드를 담는다.
 */
@Getter
@Builder
public class FcmMessage {

  /** 알림 제목 */
  private final String title;

  /** 알림 내용 */
  private final String body;

  /** 알림 이미지 URL (선택) */
  private final String imageUrl;

  /** 커스텀 데이터 페이로드 */
  private final Map<String, String> data;

  /** iOS 뱃지 카운트 (선택) */
  private final Integer badge;

  /** 알림 사운드 (선택, 기본값: default) */
  private final String sound;
}
