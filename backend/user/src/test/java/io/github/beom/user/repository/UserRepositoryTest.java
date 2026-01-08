package io.github.beom.user.repository;

import static org.assertj.core.api.Assertions.assertThat;

import io.github.beom.user.domain.User;
import io.github.beom.user.domain.vo.Email;
import io.github.beom.user.domain.vo.Nickname;
import io.github.beom.user.domain.vo.UserStatus;
import io.github.beom.user.entity.UserEntity;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@ActiveProfiles("test")
@Import(UserRepository.class)
class UserRepositoryTest {

  @Autowired private UserRepository userRepository;
  @Autowired private UserJpaRepository userJpaRepository;

  @BeforeEach
  void setUp() {
    userJpaRepository.deleteAll();
  }

  @Nested
  @DisplayName("사용자 저장")
  class Save {

    @Test
    @DisplayName("성공: 새 사용자 저장")
    void save_success() {
      // given
      var user =
          User.builder()
              .email(new Email("test@gmail.com"))
              .nickname(new Nickname("testuser"))
              .build();

      // when
      var saved = userRepository.save(user);

      // then
      assertThat(saved.getId()).isNotNull();
      assertThat(saved.getEmail().value()).isEqualTo("test@gmail.com");
      assertThat(saved.getNickname().value()).isEqualTo("testuser");
    }
  }

  @Nested
  @DisplayName("사용자 조회")
  class Find {

    @Test
    @DisplayName("성공: ID로 조회")
    void findById_success() {
      // given
      var user =
          User.builder()
              .email(new Email("test@gmail.com"))
              .nickname(new Nickname("testuser"))
              .build();
      var saved = userRepository.save(user);

      // when
      var found = userRepository.findById(saved.getId());

      // then
      assertThat(found).isPresent();
      assertThat(found.get().getEmail().value()).isEqualTo("test@gmail.com");
    }

    @Test
    @DisplayName("성공: 이메일로 조회")
    void findByEmail_success() {
      // given
      var user =
          User.builder()
              .email(new Email("test@gmail.com"))
              .nickname(new Nickname("testuser"))
              .build();
      userRepository.save(user);

      // when
      var found = userRepository.findByEmail("test@gmail.com");

      // then
      assertThat(found).isPresent();
      assertThat(found.get().getNickname().value()).isEqualTo("testuser");
    }

    @Test
    @DisplayName("성공: 활성 사용자만 조회 (탈퇴 사용자 제외)")
    void findActiveById_excludesWithdrawn() {
      // given
      var entity =
          UserEntity.builder()
              .email("withdrawn@gmail.com")
              .nickname("withdrawn")
              .status(UserStatus.WITHDRAWN)
              .deletedAt(LocalDateTime.now())
              .build();
      var savedEntity = userJpaRepository.save(entity);

      // when
      var found = userRepository.findActiveById(savedEntity.getId());

      // then
      assertThat(found).isEmpty();
    }

    @Test
    @DisplayName("성공: findById는 탈퇴 사용자도 조회")
    void findById_includesWithdrawn() {
      // given
      var entity =
          UserEntity.builder()
              .email("withdrawn@gmail.com")
              .nickname("withdrawn")
              .status(UserStatus.WITHDRAWN)
              .deletedAt(LocalDateTime.now())
              .build();
      var savedEntity = userJpaRepository.save(entity);

      // when
      var found = userRepository.findById(savedEntity.getId());

      // then
      assertThat(found).isPresent();
    }
  }

  @Nested
  @DisplayName("존재 여부 확인")
  class Exists {

    @Test
    @DisplayName("성공: 이메일 존재")
    void existsByEmail_true() {
      // given
      var user =
          User.builder()
              .email(new Email("exists@gmail.com"))
              .nickname(new Nickname("existuser"))
              .build();
      userRepository.save(user);

      // when & then
      assertThat(userRepository.existsByEmail("exists@gmail.com")).isTrue();
      assertThat(userRepository.existsByEmail("notexists@gmail.com")).isFalse();
    }

    @Test
    @DisplayName("성공: 닉네임 존재")
    void existsByNickname_true() {
      // given
      var user =
          User.builder()
              .email(new Email("test@gmail.com"))
              .nickname(new Nickname("uniquenick"))
              .build();
      userRepository.save(user);

      // when & then
      assertThat(userRepository.existsByNickname("uniquenick")).isTrue();
      assertThat(userRepository.existsByNickname("othernick")).isFalse();
    }
  }

  @Nested
  @DisplayName("소프트 삭제")
  class SoftDelete {

    @Test
    @DisplayName("성공: 탈퇴 후 findActiveById로 조회 불가")
    void withdrawnUser_notFoundByFindActive() {
      // given
      var user =
          User.builder()
              .email(new Email("test@gmail.com"))
              .nickname(new Nickname("testuser"))
              .build();
      var saved = userRepository.save(user);

      // 탈퇴 처리
      saved.withdraw();
      userRepository.save(saved);

      // when
      var activeResult = userRepository.findActiveById(saved.getId());
      var normalResult = userRepository.findById(saved.getId());

      // then
      assertThat(activeResult).isEmpty();
      assertThat(normalResult).isPresent();
      assertThat(normalResult.get().isDeleted()).isTrue();
    }

    @Test
    @DisplayName("성공: 탈퇴 후 재활성화")
    void withdrawnUser_reactivate() {
      // given
      var user =
          User.builder()
              .email(new Email("test@gmail.com"))
              .nickname(new Nickname("testuser"))
              .build();
      var saved = userRepository.save(user);

      saved.withdraw();
      userRepository.save(saved);

      // when - 재활성화
      var withdrawn = userRepository.findById(saved.getId()).orElseThrow();
      withdrawn.activate();
      var reactivated = userRepository.save(withdrawn);

      // then
      assertThat(reactivated.isDeleted()).isFalse();
      assertThat(reactivated.getStatus()).isEqualTo(UserStatus.ACTIVE);
      assertThat(userRepository.findActiveById(saved.getId())).isPresent();
    }
  }
}
