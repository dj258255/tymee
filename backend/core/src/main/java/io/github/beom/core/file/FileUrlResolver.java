package io.github.beom.core.file;

import java.util.Optional;

/**
 * 파일 URL 조회 인터페이스. Upload 모듈에서 구현하고 User 모듈에서 사용한다.
 *
 * <p>모듈 간 순환 의존성을 피하기 위해 core에 인터페이스만 정의한다.
 */
public interface FileUrlResolver {

  /**
   * 파일 ID로 URL 조회.
   *
   * @param fileId 파일 공개 ID (스노우플레이크)
   * @return 파일 URL (없으면 empty)
   */
  Optional<String> resolveUrl(Long fileId);
}
