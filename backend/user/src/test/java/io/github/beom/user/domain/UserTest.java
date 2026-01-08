package io.github.beom.user.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import io.github.beom.user.domain.vo.Email;
import io.github.beom.user.domain.vo.Nickname;
import io.github.beom.user.domain.vo.UserStatus;
import java.time.LocalDateTime;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class UserTest {

  @Nested
  @DisplayName("OAuth 사용자 생성")
  class CreateOAuthUser {

    @Test
    @DisplayName("성공: 이메일로 생성 시 닉네임 자동 생성")
    void createWithEmail_generatesNickname() {
      // when
      var user = User.createOAuthUser(new Email("test@gmail.com"));

      // then
      assertThat(user.getEmail().value()).isEqualTo("test@gmail.com");
      assertThat(user.getNickname().value()).startsWith("user_");
      assertThat(user.getStatus()).isEqualTo(UserStatus.ACTIVE);
      assertThat(user.canLogin()).isTrue();
    }

    @Test
    @DisplayName("성공: 이메일 없이 생성")
    void createWithoutEmail_success() {
      // when
      var user = User.createOAuthUser(null);

      // then
      assertThat(user.getEmail()).isNull();
      assertThat(user.getNickname().value()).startsWith("user_");
    }
  }

  @Nested
  @DisplayName("표시 이름 (getDisplayName)")
  class GetDisplayName {

    @Test
    @DisplayName("닉네임이 있으면 닉네임 반환")
    void hasNickname_returnsNickname() {
      // given
      var user =
          User.builder()
              .email(new Email("test@gmail.com"))
              .nickname(new Nickname("mycoolnick"))
              .build();

      // when & then
      assertThat(user.getDisplayName()).isEqualTo("mycoolnick");
    }

    @Test
    @DisplayName("닉네임 없으면 이메일 로컬파트 반환")
    void noNickname_returnsEmailLocalPart() {
      // given
      var user = User.builder().email(new Email("test@gmail.com")).nickname(null).build();

      // when & then
      assertThat(user.getDisplayName()).isEqualTo("test");
    }

    @Test
    @DisplayName("닉네임도 이메일도 없으면 '사용자' 반환")
    void noNicknameNoEmail_returnsDefault() {
      // given
      var user = User.builder().email(null).nickname(null).build();

      // when & then
      assertThat(user.getDisplayName()).isEqualTo("사용자");
    }
  }

  @Nested
  @DisplayName("회원 탈퇴")
  class Withdraw {

    @Test
    @DisplayName("성공: 활성 사용자 탈퇴")
    void activeUser_withdraws() {
      // given
      var user =
          User.builder()
              .id(1L)
              .email(new Email("test@gmail.com"))
              .nickname(new Nickname("testuser"))
              .status(UserStatus.ACTIVE)
              .build();

      // when
      user.withdraw();

      // then
      assertThat(user.getStatus()).isEqualTo(UserStatus.WITHDRAWN);
      assertThat(user.getDeletedAt()).isNotNull();
      assertThat(user.isDeleted()).isTrue();
      assertThat(user.canLogin()).isFalse();
    }

    @Test
    @DisplayName("실패: 이미 탈퇴한 사용자")
    void alreadyWithdrawn_throwsException() {
      // given
      var user =
          User.builder()
              .id(1L)
              .email(new Email("test@gmail.com"))
              .nickname(new Nickname("testuser"))
              .status(UserStatus.WITHDRAWN)
              .deletedAt(LocalDateTime.now())
              .build();

      // when & then
      assertThatThrownBy(user::withdraw)
          .isInstanceOf(IllegalStateException.class)
          .hasMessage("이미 탈퇴한 사용자입니다");
    }
  }

  @Nested
  @DisplayName("계정 복구 (activate)")
  class Activate {

    @Test
    @DisplayName("성공: 탈퇴한 사용자 복구")
    void withdrawnUser_reactivates() {
      // given
      var user =
          User.builder()
              .id(1L)
              .email(new Email("test@gmail.com"))
              .nickname(new Nickname("testuser"))
              .status(UserStatus.WITHDRAWN)
              .deletedAt(LocalDateTime.now().minusDays(1))
              .build();

      // when
      user.activate();

      // then
      assertThat(user.getStatus()).isEqualTo(UserStatus.ACTIVE);
      assertThat(user.getDeletedAt()).isNull();
      assertThat(user.isDeleted()).isFalse();
      assertThat(user.canLogin()).isTrue();
    }

    @Test
    @DisplayName("성공: 정지된 사용자 활성화")
    void suspendedUser_activates() {
      // given
      var user =
          User.builder()
              .id(1L)
              .email(new Email("test@gmail.com"))
              .nickname(new Nickname("testuser"))
              .status(UserStatus.SUSPENDED)
              .build();

      // when
      user.activate();

      // then
      assertThat(user.getStatus()).isEqualTo(UserStatus.ACTIVE);
      assertThat(user.canLogin()).isTrue();
    }
  }

  @Nested
  @DisplayName("계정 상태 변경")
  class StatusChange {

    @Test
    @DisplayName("정지: 활성 → 정지")
    void suspend_success() {
      // given
      var user =
          User.builder()
              .id(1L)
              .email(new Email("test@gmail.com"))
              .nickname(new Nickname("testuser"))
              .status(UserStatus.ACTIVE)
              .build();

      // when
      user.suspend();

      // then
      assertThat(user.getStatus()).isEqualTo(UserStatus.SUSPENDED);
      assertThat(user.canLogin()).isFalse();
    }

    @Test
    @DisplayName("밴: 활성 → 밴")
    void ban_success() {
      // given
      var user =
          User.builder()
              .id(1L)
              .email(new Email("test@gmail.com"))
              .nickname(new Nickname("testuser"))
              .status(UserStatus.ACTIVE)
              .build();

      // when
      user.ban();

      // then
      assertThat(user.getStatus()).isEqualTo(UserStatus.BANNED);
      assertThat(user.canLogin()).isFalse();
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
              .nickname(new Nickname("oldnick"))
              .bio("old bio")
              .build();

      // when
      user.updateProfile(new Nickname("newnick"), "new bio");

      // then
      assertThat(user.getNickname().value()).isEqualTo("newnick");
      assertThat(user.getBio()).isEqualTo("new bio");
      assertThat(user.getUpdatedAt()).isNotNull();
    }
  }

  @Nested
  @DisplayName("공부 시간")
  class StudyTime {

    @Test
    @DisplayName("성공: 공부 시간 추가")
    void addStudyMinutes_success() {
      // given
      var user =
          User.builder()
              .id(1L)
              .email(new Email("test@gmail.com"))
              .nickname(new Nickname("testuser"))
              .build();

      // when
      user.addStudyMinutes(120);

      // then
      assertThat(user.getTotalStudyMinutes()).isEqualTo(120);
    }

    @Test
    @DisplayName("성공: 공부 시간 누적")
    void addStudyMinutes_accumulates() {
      // given
      var user =
          User.builder()
              .id(1L)
              .email(new Email("test@gmail.com"))
              .nickname(new Nickname("testuser"))
              .build();

      // when
      user.addStudyMinutes(60);
      user.addStudyMinutes(30);

      // then
      assertThat(user.getTotalStudyMinutes()).isEqualTo(90);
    }
  }

  @Nested
  @DisplayName("로그인 가능 여부")
  class CanLogin {

    @Test
    @DisplayName("활성 사용자: 로그인 가능")
    void activeUser_canLogin() {
      var user =
          User.builder()
              .email(new Email("test@gmail.com"))
              .nickname(new Nickname("testuser"))
              .status(UserStatus.ACTIVE)
              .build();

      assertThat(user.canLogin()).isTrue();
    }

    @Test
    @DisplayName("정지 사용자: 로그인 불가")
    void suspendedUser_cannotLogin() {
      var user =
          User.builder()
              .email(new Email("test@gmail.com"))
              .nickname(new Nickname("testuser"))
              .status(UserStatus.SUSPENDED)
              .build();

      assertThat(user.canLogin()).isFalse();
    }

    @Test
    @DisplayName("밴 사용자: 로그인 불가")
    void bannedUser_cannotLogin() {
      var user =
          User.builder()
              .email(new Email("test@gmail.com"))
              .nickname(new Nickname("testuser"))
              .status(UserStatus.BANNED)
              .build();

      assertThat(user.canLogin()).isFalse();
    }

    @Test
    @DisplayName("탈퇴 사용자: 로그인 불가")
    void withdrawnUser_cannotLogin() {
      var user =
          User.builder()
              .email(new Email("test@gmail.com"))
              .nickname(new Nickname("testuser"))
              .status(UserStatus.WITHDRAWN)
              .deletedAt(LocalDateTime.now())
              .build();

      assertThat(user.canLogin()).isFalse();
    }
  }
}
