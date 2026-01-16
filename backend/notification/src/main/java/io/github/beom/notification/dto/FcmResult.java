package io.github.beom.notification.dto;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

/**
 * FCM 발송 결과 DTO.
 *
 * <p>다중 발송 시 성공/실패 현황을 담는다.
 */
@Getter
@Builder
public class FcmResult {

  /** 총 발송 대상 수 */
  private final int totalCount;

  /** 성공 건수 */
  private final int successCount;

  /** 실패 건수 */
  private final int failureCount;

  /** 실패한 토큰 목록 (토큰 만료 등) */
  private final List<String> failedTokens;

  public static FcmResult success(int count) {
    return FcmResult.builder()
        .totalCount(count)
        .successCount(count)
        .failureCount(0)
        .failedTokens(List.of())
        .build();
  }

  public static FcmResult single(boolean success, String token) {
    return FcmResult.builder()
        .totalCount(1)
        .successCount(success ? 1 : 0)
        .failureCount(success ? 0 : 1)
        .failedTokens(success ? List.of() : List.of(token))
        .build();
  }
}
