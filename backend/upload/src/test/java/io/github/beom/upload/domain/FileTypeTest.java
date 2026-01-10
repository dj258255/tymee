package io.github.beom.upload.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class FileTypeTest {

  @Nested
  @DisplayName("MIME 타입으로 FileType 변환")
  class FromMimeType {

    @ParameterizedTest
    @ValueSource(strings = {
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/heic",
        "image/heif",
        "image/svg+xml",
        "image/bmp"
    })
    @DisplayName("성공: image/* -> IMAGE")
    void fromMimeType_image(String mimeType) {
      assertThat(FileType.fromMimeType(mimeType)).isEqualTo(FileType.IMAGE);
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "video/mp4",
        "video/quicktime",
        "video/webm",
        "video/x-m4v",
        "video/avi",
        "video/mpeg"
    })
    @DisplayName("성공: video/* -> VIDEO")
    void fromMimeType_video(String mimeType) {
      assertThat(FileType.fromMimeType(mimeType)).isEqualTo(FileType.VIDEO);
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "audio/mpeg",
        "audio/mp4",
        "audio/aac",
        "audio/wav",
        "audio/x-m4a",
        "audio/m4a",
        "audio/ogg"
    })
    @DisplayName("성공: audio/* -> AUDIO")
    void fromMimeType_audio(String mimeType) {
      assertThat(FileType.fromMimeType(mimeType)).isEqualTo(FileType.AUDIO);
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "application/pdf",
        "application/zip",
        "text/plain",
        "text/html",
        "application/json"
    })
    @DisplayName("실패: 지원하지 않는 MIME 타입")
    void fromMimeType_unsupported(String mimeType) {
      assertThatThrownBy(() -> FileType.fromMimeType(mimeType))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("Unsupported MIME type");
    }

    @Test
    @DisplayName("실패: null MIME 타입")
    void fromMimeType_null() {
      assertThatThrownBy(() -> FileType.fromMimeType(null))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("MIME type cannot be null");
    }

    @Test
    @DisplayName("실패: 빈 문자열 MIME 타입")
    void fromMimeType_empty() {
      assertThatThrownBy(() -> FileType.fromMimeType(""))
          .isInstanceOf(IllegalArgumentException.class);
    }
  }

  @Nested
  @DisplayName("코드로 FileType 변환")
  class FromCode {

    @Test
    @DisplayName("성공: image -> IMAGE")
    void fromCode_image() {
      assertThat(FileType.fromCode("image")).isEqualTo(FileType.IMAGE);
    }

    @Test
    @DisplayName("성공: video -> VIDEO")
    void fromCode_video() {
      assertThat(FileType.fromCode("video")).isEqualTo(FileType.VIDEO);
    }

    @Test
    @DisplayName("성공: audio -> AUDIO")
    void fromCode_audio() {
      assertThat(FileType.fromCode("audio")).isEqualTo(FileType.AUDIO);
    }

    @Test
    @DisplayName("실패: 알 수 없는 코드")
    void fromCode_unknown() {
      assertThatThrownBy(() -> FileType.fromCode("document"))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("Unknown file type");
    }

    @Test
    @DisplayName("실패: 대소문자 구분")
    void fromCode_caseSensitive() {
      assertThatThrownBy(() -> FileType.fromCode("IMAGE"))
          .isInstanceOf(IllegalArgumentException.class);
    }
  }

  @Nested
  @DisplayName("FileType 코드 조회")
  class GetCode {

    @Test
    @DisplayName("IMAGE의 코드는 image")
    void getCode_image() {
      assertThat(FileType.IMAGE.getCode()).isEqualTo("image");
    }

    @Test
    @DisplayName("VIDEO의 코드는 video")
    void getCode_video() {
      assertThat(FileType.VIDEO.getCode()).isEqualTo("video");
    }

    @Test
    @DisplayName("AUDIO의 코드는 audio")
    void getCode_audio() {
      assertThat(FileType.AUDIO.getCode()).isEqualTo("audio");
    }
  }
}
