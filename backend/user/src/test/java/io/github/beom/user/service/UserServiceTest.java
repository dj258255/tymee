package io.github.beom.user.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import io.github.beom.core.event.ProfileImageChangedEvent;
import io.github.beom.core.exception.BusinessException;
import io.github.beom.core.exception.EntityNotFoundException;
import io.github.beom.user.domain.User;
import io.github.beom.user.domain.vo.Email;
import io.github.beom.user.domain.vo.Nickname;
import io.github.beom.user.domain.vo.UserStatus;
import io.github.beom.user.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

  @Mock private UserRepository userRepository;
  @Mock private ApplicationEventPublisher eventPublisher;

  @InjectMocks private UserService userService;

  @Nested
  @DisplayName("사용자 조회")
  class GetUser {

    @Test
    @DisplayName("성공: ID로 활성 사용자 조회")
    void getById_success() {
      // given
      var user =
          User.builder()
              .id(1L)
              .email(new Email("test@gmail.com"))
              .nickname(new Nickname("tester"))
              .build();

      given(userRepository.findActiveById(1L)).willReturn(Optional.of(user));

      // when
      var result = userService.getById(1L);

      // then
      assertThat(result.getId()).isEqualTo(1L);
      assertThat(result.getEmail().value()).isEqualTo("test@gmail.com");
    }

    @Test
    @DisplayName("실패: 존재하지 않는 사용자")
    void getById_notFound() {
      // given
      given(userRepository.findActiveById(999L)).willReturn(Optional.empty());

      // when & then
      assertThatThrownBy(() -> userService.getById(999L))
          .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    @DisplayName("실패: 탈퇴한 사용자 조회 불가")
    void getById_withdrawnUser_notFound() {
      // given
      given(userRepository.findActiveById(1L)).willReturn(Optional.empty());

      // when & then
      assertThatThrownBy(() -> userService.getById(1L)).isInstanceOf(EntityNotFoundException.class);
    }
  }

  @Nested
  @DisplayName("프로필 수정")
  class UpdateProfile {

    @Test
    @DisplayName("성공: 닉네임과 자기소개 수정")
    void updateProfile_success() {
      // given
      var user =
          User.builder()
              .id(1L)
              .email(new Email("test@gmail.com"))
              .nickname(new Nickname("oldnk"))
              .build();

      given(userRepository.findActiveById(1L)).willReturn(Optional.of(user));
      given(userRepository.existsByNickname("newnk")).willReturn(false);
      given(userRepository.save(any(User.class)))
          .willAnswer(invocation -> invocation.getArgument(0));

      // when
      var result = userService.updateProfile(1L, "newnk", "Hello!", null);

      // then
      assertThat(result.getNickname().value()).isEqualTo("newnk");
      assertThat(result.getBio()).isEqualTo("Hello!");
    }

    @Test
    @DisplayName("성공: 닉네임 동일하면 중복 검사 안함")
    void updateProfile_sameNickname_noDuplicateCheck() {
      // given
      var user =
          User.builder()
              .id(1L)
              .email(new Email("test@gmail.com"))
              .nickname(new Nickname("samenk"))
              .build();

      given(userRepository.findActiveById(1L)).willReturn(Optional.of(user));
      given(userRepository.save(any(User.class)))
          .willAnswer(invocation -> invocation.getArgument(0));

      // when
      var result = userService.updateProfile(1L, "samenick", "Updated bio", null);

      // then
      assertThat(result.getBio()).isEqualTo("Updated bio");
    }

    @Test
    @DisplayName("실패: 닉네임 중복")
    void updateProfile_duplicateNickname_fails() {
      // given
      var user =
          User.builder()
              .id(1L)
              .email(new Email("test@gmail.com"))
              .nickname(new Nickname("oldnk"))
              .build();

      given(userRepository.findActiveById(1L)).willReturn(Optional.of(user));
      given(userRepository.existsByNickname("takenn")).willReturn(true);

      // when & then
      assertThatThrownBy(() -> userService.updateProfile(1L, "takenn", "bio", null))
          .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("성공: 닉네임 빈 문자열이면 닉네임 변경 안함 (bio만 변경)")
    void updateProfile_nicknameEmpty_onlyBioUpdated() {
      // given
      var user =
          User.builder()
              .id(1L)
              .email(new Email("test@gmail.com"))
              .nickname(new Nickname("oldnk"))
              .build();

      given(userRepository.findActiveById(1L)).willReturn(Optional.of(user));
      given(userRepository.save(any(User.class)))
          .willAnswer(invocation -> invocation.getArgument(0));

      // when - 빈 문자열은 무시되고 bio만 변경
      var result = userService.updateProfile(1L, "", "new bio", null);

      // then
      assertThat(result.getNickname().value()).isEqualTo("oldnk"); // 닉네임 유지
      assertThat(result.getBio()).isEqualTo("new bio"); // bio만 변경
    }

    @Test
    @DisplayName("실패: 닉네임 30바이트 초과 (한글 11자)")
    void updateProfile_nicknameTooLong_fails() {
      // given
      var user =
          User.builder()
              .id(1L)
              .email(new Email("test@gmail.com"))
              .nickname(new Nickname("oldnk"))
              .build();
      // 한글 11자 = 33바이트 (30바이트 초과)
      var longNickname = "가나다라마바사아자차카";

      given(userRepository.findActiveById(1L)).willReturn(Optional.of(user));
      given(userRepository.existsByNickname(longNickname)).willReturn(false);

      // when & then
      assertThatThrownBy(() -> userService.updateProfile(1L, longNickname, "bio", null))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("바이트");
    }
  }

  @Nested
  @DisplayName("프로필 이미지 변경")
  class UpdateProfileImage {

    @Test
    @DisplayName("성공: 프로필 이미지 변경 시 이전 이미지 삭제 이벤트 발행")
    void updateProfileImage_publishesEventForOldImage() {
      // given
      var user =
          User.builder()
              .id(1L)
              .email(new Email("test@gmail.com"))
              .nickname(new Nickname("tester"))
              .profileImageId(1000L) // 이전 이미지 ID
              .build();

      given(userRepository.findActiveById(1L)).willReturn(Optional.of(user));
      given(userRepository.save(any(User.class)))
          .willAnswer(invocation -> invocation.getArgument(0));

      // when
      userService.updateProfile(1L, null, null, 2000L); // 새 이미지 ID

      // then
      ArgumentCaptor<ProfileImageChangedEvent> eventCaptor =
          ArgumentCaptor.forClass(ProfileImageChangedEvent.class);
      verify(eventPublisher).publishEvent(eventCaptor.capture());

      ProfileImageChangedEvent capturedEvent = eventCaptor.getValue();
      assertThat(capturedEvent.oldProfileImageId()).isEqualTo(1000L);
    }

    @Test
    @DisplayName("성공: 이전 이미지 없으면 이벤트 발행 안함")
    void updateProfileImage_noOldImage_noEvent() {
      // given
      var user =
          User.builder()
              .id(1L)
              .email(new Email("test@gmail.com"))
              .nickname(new Nickname("tester"))
              .profileImageId(null) // 이전 이미지 없음
              .build();

      given(userRepository.findActiveById(1L)).willReturn(Optional.of(user));
      given(userRepository.save(any(User.class)))
          .willAnswer(invocation -> invocation.getArgument(0));

      // when
      userService.updateProfile(1L, null, null, 2000L);

      // then
      verify(eventPublisher, never()).publishEvent(any(ProfileImageChangedEvent.class));
    }

    @Test
    @DisplayName("성공: 동일한 이미지 ID면 이벤트 발행 안함")
    void updateProfileImage_sameImageId_noEvent() {
      // given
      var user =
          User.builder()
              .id(1L)
              .email(new Email("test@gmail.com"))
              .nickname(new Nickname("tester"))
              .profileImageId(1000L)
              .build();

      given(userRepository.findActiveById(1L)).willReturn(Optional.of(user));
      given(userRepository.save(any(User.class)))
          .willAnswer(invocation -> invocation.getArgument(0));

      // when - 같은 이미지 ID로 업데이트
      userService.updateProfile(1L, null, null, 1000L);

      // then
      verify(eventPublisher, never()).publishEvent(any(ProfileImageChangedEvent.class));
    }

    @Test
    @DisplayName("성공: profileImageId가 null이면 이미지 변경 안함")
    void updateProfile_nullProfileImageId_noImageChange() {
      // given
      var user =
          User.builder()
              .id(1L)
              .email(new Email("test@gmail.com"))
              .nickname(new Nickname("tester"))
              .profileImageId(1000L) // 기존 이미지
              .build();

      given(userRepository.findActiveById(1L)).willReturn(Optional.of(user));
      given(userRepository.save(any(User.class)))
          .willAnswer(invocation -> invocation.getArgument(0));

      // when - profileImageId를 null로 전달
      var result = userService.updateProfile(1L, null, "new bio", null);

      // then
      verify(eventPublisher, never()).publishEvent(any(ProfileImageChangedEvent.class));
      assertThat(result.getProfileImageId()).isEqualTo(1000L); // 기존 이미지 유지
    }
  }

  @Nested
  @DisplayName("닉네임 중복 확인")
  class CheckNickname {

    @Test
    @DisplayName("성공: 사용 가능한 닉네임")
    void existsByNickname_available() {
      // given
      given(userRepository.existsByNickname("avail")).willReturn(false);

      // when
      var result = userService.existsByNickname("avail");

      // then
      assertThat(result).isFalse();
    }

    @Test
    @DisplayName("성공: 이미 사용 중인 닉네임")
    void existsByNickname_taken() {
      // given
      given(userRepository.existsByNickname("takenn")).willReturn(true);

      // when
      var result = userService.existsByNickname("takenn");

      // then
      assertThat(result).isTrue();
    }
  }

  @Nested
  @DisplayName("회원 탈퇴")
  class Withdraw {

    @Test
    @DisplayName("성공: 소프트 삭제")
    void withdrawUser_success() {
      // given
      var user =
          User.builder()
              .id(1L)
              .email(new Email("test@gmail.com"))
              .nickname(new Nickname("tester"))
              .status(UserStatus.ACTIVE)
              .build();

      given(userRepository.findActiveById(1L)).willReturn(Optional.of(user));
      given(userRepository.save(any(User.class)))
          .willAnswer(invocation -> invocation.getArgument(0));

      // when
      userService.withdrawUser(1L);

      // then
      verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("실패: 존재하지 않는 사용자")
    void withdrawUser_notFound() {
      // given
      given(userRepository.findActiveById(999L)).willReturn(Optional.empty());

      // when & then
      assertThatThrownBy(() -> userService.withdrawUser(999L))
          .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    @DisplayName("실패: 이미 탈퇴한 사용자")
    void withdrawUser_alreadyWithdrawn() {
      // given
      var withdrawnUser =
          User.builder()
              .id(1L)
              .email(new Email("test@gmail.com"))
              .nickname(new Nickname("tester"))
              .status(UserStatus.WITHDRAWN)
              .deletedAt(LocalDateTime.now().minusDays(1))
              .build();

      given(userRepository.findActiveById(1L)).willReturn(Optional.of(withdrawnUser));

      // when & then
      assertThatThrownBy(() -> userService.withdrawUser(1L))
          .isInstanceOf(IllegalStateException.class)
          .hasMessage("이미 탈퇴한 사용자입니다");
    }
  }

  @Nested
  @DisplayName("공부 시간 추가")
  class AddStudyMinutes {

    @Test
    @DisplayName("성공: 공부 시간 추가 및 티어 갱신")
    void addStudyMinutes_success() {
      // given
      var user =
          User.builder()
              .id(1L)
              .email(new Email("test@gmail.com"))
              .nickname(new Nickname("tester"))
              .build();

      given(userRepository.findActiveById(1L)).willReturn(Optional.of(user));
      given(userRepository.save(any(User.class)))
          .willAnswer(invocation -> invocation.getArgument(0));

      // when
      userService.addStudyMinutes(1L, 60);

      // then
      verify(userRepository).save(any(User.class));
    }
  }
}
