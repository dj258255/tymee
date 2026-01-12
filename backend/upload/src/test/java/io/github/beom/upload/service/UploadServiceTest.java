package io.github.beom.upload.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import io.github.beom.core.exception.BusinessException;
import io.github.beom.core.exception.EntityNotFoundException;
import io.github.beom.core.util.SnowflakeIdGenerator;
import io.github.beom.upload.domain.FileType;
import io.github.beom.upload.domain.Upload;
import io.github.beom.upload.domain.UploadCategory;
import io.github.beom.upload.dto.PresignedUrlRequest;
import io.github.beom.upload.dto.UploadCompleteRequest;
import io.github.beom.upload.repository.UploadRepository;
import io.github.beom.upload.service.R2StorageService.PresignedUrlResult;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UploadServiceTest {

  @Mock private UploadRepository uploadRepository;
  @Mock private R2StorageService r2StorageService;
  @Mock private FileValidator fileValidator;
  @Mock private SnowflakeIdGenerator snowflakeIdGenerator;

  @InjectMocks private UploadService uploadService;

  @Nested
  @DisplayName("Presigned URL 발급")
  class GeneratePresignedUrl {

    @Test
    @DisplayName("성공: 이미지 파일 Presigned URL 발급")
    void generatePresignedUrl_image_success() {
      // given
      var request =
          new PresignedUrlRequest(
              UploadCategory.PROFILE, "profile.jpg", "image/jpeg", 1024L * 1024L // 1MB
              );

      var presignedResult =
          new PresignedUrlResult(
              "https://r2.example.com/presigned-url", "prod/profiles/images/uuid-123.jpg", 900L);

      given(
              r2StorageService.generateUploadUrl(
                  UploadCategory.PROFILE, FileType.IMAGE, "image/jpeg", "profile.jpg"))
          .willReturn(presignedResult);
      given(snowflakeIdGenerator.nextId()).willReturn(7321847264891904001L);

      // when
      var result = uploadService.generatePresignedUrl(request);

      // then
      assertThat(result.uploadUrl()).isEqualTo("https://r2.example.com/presigned-url");
      assertThat(result.publicId()).isEqualTo(7321847264891904001L);
      assertThat(result.storedPath()).isEqualTo("prod/profiles/images/uuid-123.jpg");
      assertThat(result.expiresInSeconds()).isEqualTo(900L);

      verify(fileValidator).validate("image/jpeg", 1024L * 1024L);
    }

    @Test
    @DisplayName("성공: 비디오 파일 Presigned URL 발급")
    void generatePresignedUrl_video_success() {
      // given
      var request =
          new PresignedUrlRequest(
              UploadCategory.POST, "video.mp4", "video/mp4", 50L * 1024L * 1024L // 50MB
              );

      var presignedResult =
          new PresignedUrlResult(
              "https://r2.example.com/video-presigned", "prod/posts/videos/uuid-456.mp4", 900L);

      given(
              r2StorageService.generateUploadUrl(
                  UploadCategory.POST, FileType.VIDEO, "video/mp4", "video.mp4"))
          .willReturn(presignedResult);
      given(snowflakeIdGenerator.nextId()).willReturn(7321847264891904002L);

      // when
      var result = uploadService.generatePresignedUrl(request);

      // then
      assertThat(result.uploadUrl()).contains("video-presigned");
      assertThat(result.storedPath()).contains("videos");
    }

    @Test
    @DisplayName("성공: 오디오 파일 Presigned URL 발급")
    void generatePresignedUrl_audio_success() {
      // given
      var request =
          new PresignedUrlRequest(
              UploadCategory.CHAT, "voice.m4a", "audio/m4a", 5L * 1024L * 1024L // 5MB
              );

      var presignedResult =
          new PresignedUrlResult(
              "https://r2.example.com/audio-presigned", "prod/chat/audios/uuid-789.m4a", 900L);

      given(
              r2StorageService.generateUploadUrl(
                  UploadCategory.CHAT, FileType.AUDIO, "audio/m4a", "voice.m4a"))
          .willReturn(presignedResult);
      given(snowflakeIdGenerator.nextId()).willReturn(7321847264891904003L);

      // when
      var result = uploadService.generatePresignedUrl(request);

      // then
      assertThat(result.storedPath()).contains("audios");
    }
  }

  @Nested
  @DisplayName("업로드 완료")
  class CompleteUpload {

    @Test
    @DisplayName("성공: 이미지 업로드 완료")
    void completeUpload_image_success() {
      // given
      var request =
          new UploadCompleteRequest(
              7321847264891904001L,
              "prod/profiles/images/uuid-123.jpg",
              "profile.jpg",
              "image/jpeg",
              1024L * 1024L,
              null);

      given(r2StorageService.fileExists("prod/profiles/images/uuid-123.jpg")).willReturn(true);
      given(uploadRepository.save(any(Upload.class)))
          .willAnswer(
              invocation -> {
                Upload upload = invocation.getArgument(0);
                return Upload.builder()
                    .id(1L)
                    .publicId(upload.getPublicId())
                    .uploaderId(upload.getUploaderId())
                    .fileType(upload.getFileType())
                    .mimeType(upload.getMimeType())
                    .originalName(upload.getOriginalName())
                    .storedPath(upload.getStoredPath())
                    .fileSize(upload.getFileSize())
                    .build();
              });
      given(r2StorageService.generateDownloadUrl(anyString()))
          .willReturn("https://cdn.example.com/image.jpg");

      // when
      var result = uploadService.completeUpload(100L, request);

      // then
      assertThat(result.publicId()).isEqualTo(7321847264891904001L);
      assertThat(result.originalName()).isEqualTo("profile.jpg");
      assertThat(result.mimeType()).isEqualTo("image/jpeg");
    }

    @Test
    @DisplayName("성공: 비디오 업로드 완료")
    void completeUpload_video_success() {
      // given
      var request =
          new UploadCompleteRequest(
              7321847264891904002L,
              "prod/posts/videos/uuid-456.mp4",
              "video.mp4",
              "video/mp4",
              50L * 1024L * 1024L,
              120 // 2분
              );

      given(r2StorageService.fileExists("prod/posts/videos/uuid-456.mp4")).willReturn(true);
      given(uploadRepository.save(any(Upload.class)))
          .willAnswer(
              invocation -> {
                Upload upload = invocation.getArgument(0);
                return Upload.builder()
                    .id(2L)
                    .publicId(upload.getPublicId())
                    .uploaderId(upload.getUploaderId())
                    .fileType(upload.getFileType())
                    .mimeType(upload.getMimeType())
                    .originalName(upload.getOriginalName())
                    .storedPath(upload.getStoredPath())
                    .fileSize(upload.getFileSize())
                    .duration(upload.getDuration())
                    .build();
              });
      given(r2StorageService.generateDownloadUrl(anyString()))
          .willReturn("https://cdn.example.com/video.mp4");

      // when
      var result = uploadService.completeUpload(100L, request);

      // then
      assertThat(result.fileType()).isEqualTo(FileType.VIDEO);
      assertThat(result.duration()).isEqualTo(120);
    }

    @Test
    @DisplayName("실패: R2에 파일이 존재하지 않음")
    void completeUpload_fileNotExistsInR2_fails() {
      // given
      var request =
          new UploadCompleteRequest(
              7321847264891904001L,
              "prod/profiles/images/not-uploaded.jpg",
              "profile.jpg",
              "image/jpeg",
              1024L * 1024L,
              null);

      given(r2StorageService.fileExists("prod/profiles/images/not-uploaded.jpg")).willReturn(false);

      // when & then
      assertThatThrownBy(() -> uploadService.completeUpload(100L, request))
          .isInstanceOf(BusinessException.class);

      verify(uploadRepository, never()).save(any(Upload.class));
    }
  }

  @Nested
  @DisplayName("파일 조회")
  class GetUpload {

    @Test
    @DisplayName("성공: publicId로 파일 조회")
    void getUpload_success() {
      // given
      var upload =
          Upload.builder()
              .id(1L)
              .publicId(7321847264891904001L)
              .uploaderId(100L)
              .fileType(FileType.IMAGE)
              .mimeType("image/jpeg")
              .originalName("profile.jpg")
              .storedPath("prod/profiles/images/uuid-123.jpg")
              .fileSize(1024L * 1024L)
              .build();

      given(uploadRepository.findActiveByPublicId(7321847264891904001L))
          .willReturn(Optional.of(upload));
      given(r2StorageService.generateDownloadUrl("prod/profiles/images/uuid-123.jpg"))
          .willReturn("https://cdn.example.com/image.jpg");

      // when
      var result = uploadService.getUpload(7321847264891904001L);

      // then
      assertThat(result.publicId()).isEqualTo(7321847264891904001L);
      assertThat(result.url()).isEqualTo("https://cdn.example.com/image.jpg");
    }

    @Test
    @DisplayName("실패: 존재하지 않는 파일")
    void getUpload_notFound() {
      // given
      given(uploadRepository.findActiveByPublicId(999L)).willReturn(Optional.empty());

      // when & then
      assertThatThrownBy(() -> uploadService.getUpload(999L))
          .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    @DisplayName("실패: 삭제된 파일 조회 불가")
    void getUpload_deletedFile_notFound() {
      // given - findActiveByPublicId는 deletedAt이 null인 것만 반환
      given(uploadRepository.findActiveByPublicId(7321847264891904001L))
          .willReturn(Optional.empty());

      // when & then
      assertThatThrownBy(() -> uploadService.getUpload(7321847264891904001L))
          .isInstanceOf(EntityNotFoundException.class);
    }
  }

  @Nested
  @DisplayName("파일 삭제")
  class DeleteUpload {

    @Test
    @DisplayName("성공: 본인 파일 삭제 (Soft Delete)")
    void deleteUpload_success() {
      // given
      var upload =
          Upload.builder()
              .id(1L)
              .publicId(7321847264891904001L)
              .uploaderId(100L)
              .fileType(FileType.IMAGE)
              .mimeType("image/jpeg")
              .originalName("profile.jpg")
              .storedPath("prod/profiles/images/uuid-123.jpg")
              .fileSize(1024L * 1024L)
              .build();

      given(uploadRepository.findActiveByPublicId(7321847264891904001L))
          .willReturn(Optional.of(upload));
      given(uploadRepository.save(any(Upload.class)))
          .willAnswer(invocation -> invocation.getArgument(0));

      // when
      uploadService.deleteUpload(100L, 7321847264891904001L);

      // then
      verify(uploadRepository).save(any(Upload.class));
    }

    @Test
    @DisplayName("실패: 다른 사용자의 파일 삭제 시도")
    void deleteUpload_notOwner_fails() {
      // given
      var upload =
          Upload.builder()
              .id(1L)
              .publicId(7321847264891904001L)
              .uploaderId(100L) // 원래 업로더
              .fileType(FileType.IMAGE)
              .mimeType("image/jpeg")
              .originalName("profile.jpg")
              .storedPath("prod/profiles/images/uuid-123.jpg")
              .fileSize(1024L * 1024L)
              .build();

      given(uploadRepository.findActiveByPublicId(7321847264891904001L))
          .willReturn(Optional.of(upload));

      // when & then - 다른 사용자(200L)가 삭제 시도
      assertThatThrownBy(() -> uploadService.deleteUpload(200L, 7321847264891904001L))
          .isInstanceOf(BusinessException.class);

      verify(uploadRepository, never()).save(any(Upload.class));
    }

    @Test
    @DisplayName("실패: 존재하지 않는 파일 삭제")
    void deleteUpload_notFound() {
      // given
      given(uploadRepository.findActiveByPublicId(999L)).willReturn(Optional.empty());

      // when & then
      assertThatThrownBy(() -> uploadService.deleteUpload(100L, 999L))
          .isInstanceOf(EntityNotFoundException.class);
    }
  }

  @Nested
  @DisplayName("내부용 Soft Delete (softDeleteByPublicId)")
  class SoftDeleteByPublicId {

    @Test
    @DisplayName("성공: publicId로 파일 Soft Delete")
    void softDeleteByPublicId_success() {
      // given
      var upload =
          Upload.builder()
              .id(1L)
              .publicId(7321847264891904001L)
              .uploaderId(100L)
              .fileType(FileType.IMAGE)
              .mimeType("image/jpeg")
              .originalName("profile.jpg")
              .storedPath("prod/profiles/images/uuid-123.jpg")
              .fileSize(1024L * 1024L)
              .build();

      given(uploadRepository.findActiveByPublicId(7321847264891904001L))
          .willReturn(Optional.of(upload));
      given(uploadRepository.save(any(Upload.class)))
          .willAnswer(invocation -> invocation.getArgument(0));

      // when
      uploadService.softDeleteByPublicId(7321847264891904001L);

      // then
      verify(uploadRepository).save(any(Upload.class));
    }

    @Test
    @DisplayName("성공: 존재하지 않는 파일은 무시 (예외 발생 안함)")
    void softDeleteByPublicId_notFound_noException() {
      // given
      given(uploadRepository.findActiveByPublicId(999L)).willReturn(Optional.empty());

      // when - 예외가 발생하지 않아야 함
      uploadService.softDeleteByPublicId(999L);

      // then
      verify(uploadRepository, never()).save(any(Upload.class));
    }

    @Test
    @DisplayName("성공: 소유자 검증 없이 삭제 (내부용)")
    void softDeleteByPublicId_noOwnerCheck() {
      // given - 업로더가 100L인 파일
      var upload =
          Upload.builder()
              .id(1L)
              .publicId(7321847264891904001L)
              .uploaderId(100L)
              .fileType(FileType.IMAGE)
              .mimeType("image/jpeg")
              .originalName("profile.jpg")
              .storedPath("prod/profiles/images/uuid-123.jpg")
              .fileSize(1024L * 1024L)
              .build();

      given(uploadRepository.findActiveByPublicId(7321847264891904001L))
          .willReturn(Optional.of(upload));
      given(uploadRepository.save(any(Upload.class)))
          .willAnswer(invocation -> invocation.getArgument(0));

      // when - 소유자 ID를 전달하지 않음 (내부용 메서드)
      uploadService.softDeleteByPublicId(7321847264891904001L);

      // then - 소유자 검증 없이 삭제됨
      verify(uploadRepository).save(any(Upload.class));
    }

    @Test
    @DisplayName("성공: 이미 삭제된 파일은 조회되지 않음")
    void softDeleteByPublicId_alreadyDeleted_notFound() {
      // given - findActiveByPublicId는 deletedAt이 null인 것만 반환
      given(uploadRepository.findActiveByPublicId(7321847264891904001L))
          .willReturn(Optional.empty());

      // when
      uploadService.softDeleteByPublicId(7321847264891904001L);

      // then - save 호출되지 않음
      verify(uploadRepository, never()).save(any(Upload.class));
    }
  }
}
