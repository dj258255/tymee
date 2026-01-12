package io.github.beom.upload.scheduler;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import io.github.beom.upload.domain.FileType;
import io.github.beom.upload.domain.Upload;
import io.github.beom.upload.repository.UploadRepository;
import io.github.beom.upload.service.R2StorageService;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class OrphanFileCleanupSchedulerTest {

  @Mock private UploadRepository uploadRepository;
  @Mock private R2StorageService r2StorageService;

  @InjectMocks private OrphanFileCleanupScheduler scheduler;

  @Nested
  @DisplayName("고아 파일 정리")
  class CleanupOrphanFiles {

    @Test
    @DisplayName("성공: 삭제 대상 파일 정리")
    void cleanupOrphanFiles_success() {
      // given
      var upload1 = createDeletedUpload(1L, 1001L, "path1.jpg");
      var upload2 = createDeletedUpload(2L, 1002L, "path2.jpg");

      given(uploadRepository.findDeletedBefore(any(LocalDateTime.class)))
          .willReturn(List.of(upload1, upload2));

      // when
      scheduler.cleanupOrphanFiles();

      // then
      verify(r2StorageService).deleteFile("path1.jpg");
      verify(r2StorageService).deleteFile("path2.jpg");
      verify(uploadRepository).delete(upload1);
      verify(uploadRepository).delete(upload2);
    }

    @Test
    @DisplayName("성공: 삭제 대상 없으면 아무것도 안함")
    void cleanupOrphanFiles_noFiles_noop() {
      // given
      given(uploadRepository.findDeletedBefore(any(LocalDateTime.class)))
          .willReturn(Collections.emptyList());

      // when
      scheduler.cleanupOrphanFiles();

      // then
      verify(r2StorageService, never()).deleteFile(any());
      verify(uploadRepository, never()).delete(any(Upload.class));
    }

    @Test
    @DisplayName("성공: R2 삭제 실패해도 다른 파일 계속 진행")
    void cleanupOrphanFiles_r2DeleteFails_continues() {
      // given
      var upload1 = createDeletedUpload(1L, 1001L, "fail.jpg");
      var upload2 = createDeletedUpload(2L, 1002L, "success.jpg");

      given(uploadRepository.findDeletedBefore(any(LocalDateTime.class)))
          .willReturn(List.of(upload1, upload2));

      // 첫 번째 파일은 실패, 두 번째 파일은 성공
      doThrow(new RuntimeException("R2 연결 실패")).when(r2StorageService).deleteFile("fail.jpg");

      // when - 예외가 전파되지 않고 계속 진행해야 함
      scheduler.cleanupOrphanFiles();

      // then - R2 삭제는 2번 모두 시도됨
      verify(r2StorageService, times(2)).deleteFile(any());

      // R2 삭제 성공한 것만 DB 삭제 (upload2만)
      verify(uploadRepository, times(1)).delete(any(Upload.class));
    }

    @Test
    @DisplayName("성공: 단일 파일 정리")
    void cleanupOrphanFiles_singleFile() {
      // given
      var upload = createDeletedUpload(1L, 1001L, "single.jpg");

      given(uploadRepository.findDeletedBefore(any(LocalDateTime.class)))
          .willReturn(List.of(upload));

      // when
      scheduler.cleanupOrphanFiles();

      // then
      verify(r2StorageService).deleteFile("single.jpg");
      verify(uploadRepository).delete(upload);
    }

    @Test
    @DisplayName("성공: 다양한 파일 타입 정리")
    void cleanupOrphanFiles_variousFileTypes() {
      // given
      var image =
          Upload.builder()
              .id(1L)
              .publicId(1001L)
              .uploaderId(100L)
              .fileType(FileType.IMAGE)
              .mimeType("image/jpeg")
              .originalName("image.jpg")
              .storedPath("prod/profiles/images/image.jpg")
              .fileSize(1024L)
              .deletedAt(LocalDateTime.now().minusDays(10))
              .build();

      var video =
          Upload.builder()
              .id(2L)
              .publicId(1002L)
              .uploaderId(100L)
              .fileType(FileType.VIDEO)
              .mimeType("video/mp4")
              .originalName("video.mp4")
              .storedPath("prod/posts/videos/video.mp4")
              .fileSize(1024L * 1024L * 50)
              .duration(120)
              .deletedAt(LocalDateTime.now().minusDays(10))
              .build();

      var audio =
          Upload.builder()
              .id(3L)
              .publicId(1003L)
              .uploaderId(100L)
              .fileType(FileType.AUDIO)
              .mimeType("audio/m4a")
              .originalName("audio.m4a")
              .storedPath("prod/chat/audios/audio.m4a")
              .fileSize(1024L * 1024L * 5)
              .duration(60)
              .deletedAt(LocalDateTime.now().minusDays(10))
              .build();

      given(uploadRepository.findDeletedBefore(any(LocalDateTime.class)))
          .willReturn(List.of(image, video, audio));

      // when
      scheduler.cleanupOrphanFiles();

      // then
      verify(r2StorageService).deleteFile("prod/profiles/images/image.jpg");
      verify(r2StorageService).deleteFile("prod/posts/videos/video.mp4");
      verify(r2StorageService).deleteFile("prod/chat/audios/audio.m4a");
      verify(uploadRepository, times(3)).delete(any(Upload.class));
    }

    @Test
    @DisplayName("엣지: DB 삭제 실패해도 계속 진행")
    void cleanupOrphanFiles_dbDeleteFails_continues() {
      // given
      var upload1 = createDeletedUpload(1L, 1001L, "path1.jpg");
      var upload2 = createDeletedUpload(2L, 1002L, "path2.jpg");

      given(uploadRepository.findDeletedBefore(any(LocalDateTime.class)))
          .willReturn(List.of(upload1, upload2));

      // upload1 DB 삭제 실패
      doThrow(new RuntimeException("DB 오류")).when(uploadRepository).delete(upload1);

      // when
      scheduler.cleanupOrphanFiles();

      // then - upload2는 정상 처리
      verify(r2StorageService).deleteFile("path1.jpg");
      verify(r2StorageService).deleteFile("path2.jpg");
      verify(uploadRepository).delete(upload2);
    }

    @Test
    @DisplayName("엣지: 대량 파일 정리")
    void cleanupOrphanFiles_manyFiles() {
      // given
      var uploads =
          java.util.stream.IntStream.range(0, 100)
              .mapToObj(i -> createDeletedUpload((long) i, 1000L + i, "path" + i + ".jpg"))
              .toList();

      given(uploadRepository.findDeletedBefore(any(LocalDateTime.class))).willReturn(uploads);

      // when
      scheduler.cleanupOrphanFiles();

      // then
      verify(r2StorageService, times(100)).deleteFile(any());
      verify(uploadRepository, times(100)).delete(any(Upload.class));
    }
  }

  private Upload createDeletedUpload(Long id, Long publicId, String storedPath) {
    return Upload.builder()
        .id(id)
        .publicId(publicId)
        .uploaderId(100L)
        .fileType(FileType.IMAGE)
        .mimeType("image/jpeg")
        .originalName("test.jpg")
        .storedPath(storedPath)
        .fileSize(1024L)
        .deletedAt(LocalDateTime.now().minusDays(10))
        .build();
  }
}
