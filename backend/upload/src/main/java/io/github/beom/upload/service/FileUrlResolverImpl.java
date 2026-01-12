package io.github.beom.upload.service;

import io.github.beom.core.file.FileUrlResolver;
import io.github.beom.upload.repository.UploadRepository;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** FileUrlResolver 구현체. Upload 모듈의 저장소와 R2 서비스를 사용하여 URL을 조회한다. */
@Component
@RequiredArgsConstructor
public class FileUrlResolverImpl implements FileUrlResolver {

  private final UploadRepository uploadRepository;
  private final R2StorageService r2StorageService;

  @Override
  public Optional<String> resolveUrl(Long fileId) {
    if (fileId == null) {
      return Optional.empty();
    }

    return uploadRepository
        .findActiveByPublicId(fileId)
        .map(upload -> r2StorageService.generateDownloadUrl(upload.getStoredPath()));
  }
}
