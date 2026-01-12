package io.github.beom.upload.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class UploadTest {

  @Nested
  @DisplayName("Upload 생성")
  class Create {

    @Test
    @DisplayName("성공: 이미지 업로드 생성")
    void create_image_success() {
      // when
      var upload =
          Upload.create(
              7321847264891904001L,
              100L,
              "image/jpeg",
              "profile.jpg",
              "prod/profiles/images/uuid-123.jpg",
              1024L * 1024L,
              null);

      // then
      assertThat(upload.getPublicId()).isEqualTo(7321847264891904001L);
      assertThat(upload.getUploaderId()).isEqualTo(100L);
      assertThat(upload.getFileType()).isEqualTo(FileType.IMAGE);
      assertThat(upload.getMimeType()).isEqualTo("image/jpeg");
      assertThat(upload.getOriginalName()).isEqualTo("profile.jpg");
      assertThat(upload.getStoredPath()).isEqualTo("prod/profiles/images/uuid-123.jpg");
      assertThat(upload.getFileSize()).isEqualTo(1024L * 1024L);
      assertThat(upload.getDuration()).isNull();
      assertThat(upload.isDeleted()).isFalse();
      assertThat(upload.getCreatedAt()).isNotNull();
    }

    @Test
    @DisplayName("성공: 비디오 업로드 생성 (duration 포함)")
    void create_video_withDuration() {
      // when
      var upload =
          Upload.create(
              7321847264891904002L,
              100L,
              "video/mp4",
              "video.mp4",
              "prod/posts/videos/uuid-456.mp4",
              50L * 1024L * 1024L,
              120 // 2분
              );

      // then
      assertThat(upload.getFileType()).isEqualTo(FileType.VIDEO);
      assertThat(upload.getDuration()).isEqualTo(120);
      assertThat(upload.hasMediaDuration()).isTrue();
    }

    @Test
    @DisplayName("성공: 오디오 업로드 생성")
    void create_audio_success() {
      // when
      var upload =
          Upload.create(
              7321847264891904003L,
              100L,
              "audio/mpeg",
              "music.mp3",
              "prod/chat/audios/uuid-789.mp3",
              5L * 1024L * 1024L,
              180 // 3분
              );

      // then
      assertThat(upload.getFileType()).isEqualTo(FileType.AUDIO);
      assertThat(upload.isAudio()).isTrue();
      assertThat(upload.isImage()).isFalse();
      assertThat(upload.isVideo()).isFalse();
    }
  }

  @Nested
  @DisplayName("파일 타입 확인")
  class FileTypeCheck {

    @Test
    @DisplayName("이미지 타입 확인")
    void isImage_true() {
      var upload = createUpload("image/png");

      assertThat(upload.isImage()).isTrue();
      assertThat(upload.isVideo()).isFalse();
      assertThat(upload.isAudio()).isFalse();
    }

    @Test
    @DisplayName("비디오 타입 확인")
    void isVideo_true() {
      var upload = createUpload("video/mp4");

      assertThat(upload.isVideo()).isTrue();
      assertThat(upload.isImage()).isFalse();
      assertThat(upload.isAudio()).isFalse();
    }

    @Test
    @DisplayName("오디오 타입 확인")
    void isAudio_true() {
      var upload = createUpload("audio/mpeg");

      assertThat(upload.isAudio()).isTrue();
      assertThat(upload.isImage()).isFalse();
      assertThat(upload.isVideo()).isFalse();
    }
  }

  @Nested
  @DisplayName("미디어 재생 시간")
  class MediaDuration {

    @Test
    @DisplayName("duration이 있으면 hasMediaDuration true")
    void hasMediaDuration_withDuration_true() {
      var upload = Upload.create(1L, 100L, "video/mp4", "video.mp4", "path", 1024L, 60);

      assertThat(upload.hasMediaDuration()).isTrue();
    }

    @Test
    @DisplayName("duration이 null이면 hasMediaDuration false")
    void hasMediaDuration_nullDuration_false() {
      var upload = Upload.create(1L, 100L, "image/jpeg", "image.jpg", "path", 1024L, null);

      assertThat(upload.hasMediaDuration()).isFalse();
    }

    @Test
    @DisplayName("duration이 0이면 hasMediaDuration false")
    void hasMediaDuration_zeroDuration_false() {
      var upload = Upload.create(1L, 100L, "video/mp4", "video.mp4", "path", 1024L, 0);

      assertThat(upload.hasMediaDuration()).isFalse();
    }

    @Test
    @DisplayName("duration이 음수면 hasMediaDuration false")
    void hasMediaDuration_negativeDuration_false() {
      var upload = Upload.create(1L, 100L, "video/mp4", "video.mp4", "path", 1024L, -1);

      assertThat(upload.hasMediaDuration()).isFalse();
    }
  }

  @Nested
  @DisplayName("파일 삭제 (Soft Delete)")
  class Delete {

    @Test
    @DisplayName("성공: 파일 삭제")
    void delete_success() {
      // given
      var upload = createUpload("image/jpeg");
      assertThat(upload.isDeleted()).isFalse();
      assertThat(upload.getDeletedAt()).isNull();

      // when
      upload.delete();

      // then
      assertThat(upload.isDeleted()).isTrue();
      assertThat(upload.getDeletedAt()).isNotNull();
    }

    @Test
    @DisplayName("실패: 이미 삭제된 파일 재삭제")
    void delete_alreadyDeleted_fails() {
      // given
      var upload = createUpload("image/jpeg");
      upload.delete();

      // when & then
      assertThatThrownBy(upload::delete)
          .isInstanceOf(IllegalStateException.class)
          .hasMessage("이미 삭제된 파일입니다");
    }
  }

  private Upload createUpload(String mimeType) {
    return Upload.create(
        7321847264891904001L, 100L, mimeType, "test-file", "prod/test/path", 1024L, null);
  }
}
