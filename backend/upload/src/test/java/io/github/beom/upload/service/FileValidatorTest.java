package io.github.beom.upload.service;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import io.github.beom.core.exception.BusinessException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class FileValidatorTest {

  private final FileValidator fileValidator = new FileValidator();

  @Nested
  @DisplayName("MIME 타입 검증")
  class ValidateMimeType {

    @ParameterizedTest
    @ValueSource(
        strings = {
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
          "image/heic",
          "image/heif"
        })
    @DisplayName("성공: 허용된 이미지 타입")
    void validateMimeType_allowedImageTypes_success(String mimeType) {
      assertThatCode(() -> fileValidator.validateMimeType(mimeType)).doesNotThrowAnyException();
    }

    @ParameterizedTest
    @ValueSource(strings = {"video/mp4", "video/quicktime", "video/webm", "video/x-m4v"})
    @DisplayName("성공: 허용된 비디오 타입")
    void validateMimeType_allowedVideoTypes_success(String mimeType) {
      assertThatCode(() -> fileValidator.validateMimeType(mimeType)).doesNotThrowAnyException();
    }

    @ParameterizedTest
    @ValueSource(
        strings = {"audio/mpeg", "audio/mp4", "audio/aac", "audio/wav", "audio/x-m4a", "audio/m4a"})
    @DisplayName("성공: 허용된 오디오 타입")
    void validateMimeType_allowedAudioTypes_success(String mimeType) {
      assertThatCode(() -> fileValidator.validateMimeType(mimeType)).doesNotThrowAnyException();
    }

    @ParameterizedTest
    @ValueSource(
        strings = {
          "application/pdf",
          "application/zip",
          "text/plain",
          "text/html",
          "application/octet-stream",
          "image/svg+xml",
          "image/bmp"
        })
    @DisplayName("실패: 허용되지 않은 MIME 타입")
    void validateMimeType_notAllowedTypes_fails(String mimeType) {
      assertThatThrownBy(() -> fileValidator.validateMimeType(mimeType))
          .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("실패: 실행 파일 업로드 시도")
    void validateMimeType_executable_fails() {
      assertThatThrownBy(() -> fileValidator.validateMimeType("application/x-msdownload"))
          .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("실패: JavaScript 파일 업로드 시도")
    void validateMimeType_javascript_fails() {
      assertThatThrownBy(() -> fileValidator.validateMimeType("application/javascript"))
          .isInstanceOf(BusinessException.class);
    }
  }

  @Nested
  @DisplayName("파일 크기 검증")
  class ValidateFileSize {

    @Test
    @DisplayName("성공: 이미지 10MB 이하")
    void validateFileSize_image_withinLimit() {
      assertThatCode(() -> fileValidator.validateFileSize("image/jpeg", 10L * 1024L * 1024L))
          .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("성공: 이미지 정확히 10MB")
    void validateFileSize_image_exactLimit() {
      assertThatCode(() -> fileValidator.validateFileSize("image/png", 10L * 1024L * 1024L))
          .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("실패: 이미지 10MB 초과")
    void validateFileSize_image_exceedsLimit() {
      long exceededSize = 10L * 1024L * 1024L + 1; // 10MB + 1byte

      assertThatThrownBy(() -> fileValidator.validateFileSize("image/jpeg", exceededSize))
          .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("성공: 비디오 100MB 이하")
    void validateFileSize_video_withinLimit() {
      assertThatCode(() -> fileValidator.validateFileSize("video/mp4", 100L * 1024L * 1024L))
          .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("실패: 비디오 100MB 초과")
    void validateFileSize_video_exceedsLimit() {
      long exceededSize = 100L * 1024L * 1024L + 1;

      assertThatThrownBy(() -> fileValidator.validateFileSize("video/mp4", exceededSize))
          .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("성공: 오디오 50MB 이하")
    void validateFileSize_audio_withinLimit() {
      assertThatCode(() -> fileValidator.validateFileSize("audio/mpeg", 50L * 1024L * 1024L))
          .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("실패: 오디오 50MB 초과")
    void validateFileSize_audio_exceedsLimit() {
      long exceededSize = 50L * 1024L * 1024L + 1;

      assertThatThrownBy(() -> fileValidator.validateFileSize("audio/mpeg", exceededSize))
          .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("성공: 1바이트 파일 (최소 크기)")
    void validateFileSize_minSize() {
      assertThatCode(() -> fileValidator.validateFileSize("image/jpeg", 1L))
          .doesNotThrowAnyException();
    }
  }

  @Nested
  @DisplayName("전체 검증 (MIME + 크기)")
  class Validate {

    @Test
    @DisplayName("성공: 유효한 이미지")
    void validate_validImage_success() {
      assertThatCode(() -> fileValidator.validate("image/jpeg", 5L * 1024L * 1024L))
          .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("실패: MIME 타입은 유효하지만 크기 초과")
    void validate_validMimeButExceedsSize_fails() {
      long exceededSize = 15L * 1024L * 1024L; // 15MB

      assertThatThrownBy(() -> fileValidator.validate("image/jpeg", exceededSize))
          .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("실패: 크기는 유효하지만 MIME 타입 불허")
    void validate_validSizeButInvalidMime_fails() {
      assertThatThrownBy(() -> fileValidator.validate("application/pdf", 1024L))
          .isInstanceOf(BusinessException.class);
    }
  }
}
