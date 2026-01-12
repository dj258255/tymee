package io.github.beom.upload.event;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;

import io.github.beom.core.event.ProfileImageChangedEvent;
import io.github.beom.upload.service.UploadService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ProfileImageChangedEventListenerTest {

  @Mock private UploadService uploadService;

  @InjectMocks private ProfileImageChangedEventListener listener;

  @Nested
  @DisplayName("프로필 이미지 변경 이벤트 처리")
  class HandleProfileImageChanged {

    @Test
    @DisplayName("성공: 이전 이미지 soft delete 호출")
    void handleProfileImageChanged_success() {
      // given
      var event = new ProfileImageChangedEvent(1000L);

      // when
      listener.handleProfileImageChanged(event);

      // then
      verify(uploadService).softDeleteByPublicId(1000L);
    }

    @Test
    @DisplayName("성공: 삭제 실패해도 예외 전파 안함")
    void handleProfileImageChanged_deleteFails_noException() {
      // given
      var event = new ProfileImageChangedEvent(1000L);
      doThrow(new RuntimeException("R2 연결 실패")).when(uploadService).softDeleteByPublicId(1000L);

      // when - 예외가 전파되지 않아야 함
      listener.handleProfileImageChanged(event);

      // then
      verify(uploadService).softDeleteByPublicId(1000L);
    }

    @Test
    @DisplayName("성공: 다양한 이미지 ID로 호출")
    void handleProfileImageChanged_variousIds() {
      // given
      var event1 = new ProfileImageChangedEvent(7321847264891904001L);
      var event2 = new ProfileImageChangedEvent(7321847264891904002L);

      // when
      listener.handleProfileImageChanged(event1);
      listener.handleProfileImageChanged(event2);

      // then
      verify(uploadService).softDeleteByPublicId(7321847264891904001L);
      verify(uploadService).softDeleteByPublicId(7321847264891904002L);
    }
  }
}
