package io.github.beom.upload.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class UploadCategoryTest {

  @Nested
  @DisplayName("카테고리 경로 조회")
  class GetPath {

    @Test
    @DisplayName("PROFILE의 경로는 profiles")
    void getPath_profile() {
      assertThat(UploadCategory.PROFILE.getPath()).isEqualTo("profiles");
    }

    @Test
    @DisplayName("POST의 경로는 posts")
    void getPath_post() {
      assertThat(UploadCategory.POST.getPath()).isEqualTo("posts");
    }

    @Test
    @DisplayName("CHAT의 경로는 chat")
    void getPath_chat() {
      assertThat(UploadCategory.CHAT.getPath()).isEqualTo("chat");
    }
  }

  @Nested
  @DisplayName("코드로 카테고리 변환")
  class FromCode {

    @Test
    @DisplayName("성공: profiles -> PROFILE")
    void fromCode_profiles() {
      assertThat(UploadCategory.fromCode("profiles")).isEqualTo(UploadCategory.PROFILE);
    }

    @Test
    @DisplayName("성공: posts -> POST")
    void fromCode_posts() {
      assertThat(UploadCategory.fromCode("posts")).isEqualTo(UploadCategory.POST);
    }

    @Test
    @DisplayName("성공: chat -> CHAT")
    void fromCode_chat() {
      assertThat(UploadCategory.fromCode("chat")).isEqualTo(UploadCategory.CHAT);
    }

    @Test
    @DisplayName("실패: 알 수 없는 카테고리 코드")
    void fromCode_unknown() {
      assertThatThrownBy(() -> UploadCategory.fromCode("unknown"))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("Unknown upload category");
    }

    @Test
    @DisplayName("실패: 대소문자 구분")
    void fromCode_caseSensitive() {
      assertThatThrownBy(() -> UploadCategory.fromCode("PROFILES"))
          .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("실패: null 코드")
    void fromCode_null() {
      assertThatThrownBy(() -> UploadCategory.fromCode(null))
          .isInstanceOf(IllegalArgumentException.class);
    }
  }

  @Nested
  @DisplayName("R2 저장 경로 생성 시나리오")
  class StoragePathScenario {

    @Test
    @DisplayName("프로필 이미지 경로: {env}/profiles/images/{uuid}.jpg")
    void profileImagePath() {
      var category = UploadCategory.PROFILE;
      var fileType = FileType.IMAGE;
      var env = "prod";
      var uuid = "abc-123";

      var path = env + "/" + category.getPath() + "/" + fileType.getCode() + "s/" + uuid + ".jpg";

      assertThat(path).isEqualTo("prod/profiles/images/abc-123.jpg");
    }

    @Test
    @DisplayName("게시글 비디오 경로: {env}/posts/videos/{uuid}.mp4")
    void postVideoPath() {
      var category = UploadCategory.POST;
      var fileType = FileType.VIDEO;
      var env = "staging";
      var uuid = "def-456";

      var path = env + "/" + category.getPath() + "/" + fileType.getCode() + "s/" + uuid + ".mp4";

      assertThat(path).isEqualTo("staging/posts/videos/def-456.mp4");
    }

    @Test
    @DisplayName("채팅 오디오 경로: {env}/chat/audios/{uuid}.m4a")
    void chatAudioPath() {
      var category = UploadCategory.CHAT;
      var fileType = FileType.AUDIO;
      var env = "local";
      var uuid = "ghi-789";

      var path = env + "/" + category.getPath() + "/" + fileType.getCode() + "s/" + uuid + ".m4a";

      assertThat(path).isEqualTo("local/chat/audios/ghi-789.m4a");
    }
  }
}
