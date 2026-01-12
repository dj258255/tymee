package io.github.beom.timeblock.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import io.github.beom.core.exception.BusinessException;
import io.github.beom.core.exception.EntityNotFoundException;
import io.github.beom.timeblock.domain.TimeBlock;
import io.github.beom.timeblock.domain.vo.TimeBlockStatus;
import io.github.beom.timeblock.dto.TimeBlockCreateRequest;
import io.github.beom.timeblock.dto.TimeBlockResponse;
import io.github.beom.timeblock.dto.TimeBlockUpdateRequest;
import io.github.beom.timeblock.repository.TimeBlockRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("TimeBlockService 테스트")
class TimeBlockServiceTest {

  @Mock private TimeBlockRepository timeBlockRepository;

  @InjectMocks private TimeBlockService timeBlockService;

  @Nested
  @DisplayName("타임블록 생성")
  class CreateTimeBlock {

    @Test
    @DisplayName("성공: 타임블록 생성")
    void createTimeBlockSuccess() {
      // given
      Long userId = 1L;
      var request =
          new TimeBlockCreateRequest(
              1L,
              LocalDate.of(2025, 1, 15),
              LocalTime.of(9, 0),
              LocalTime.of(11, 0),
              "수학 공부",
              true,
              15);

      TimeBlock savedBlock =
          TimeBlock.builder()
              .id(1L)
              .userId(userId)
              .subjectId(1L)
              .blockDate(LocalDate.of(2025, 1, 15))
              .startTime(LocalTime.of(9, 0))
              .endTime(LocalTime.of(11, 0))
              .memo("수학 공부")
              .status(TimeBlockStatus.INCOMPLETE)
              .reminderEnabled(true)
              .reminderMinutesBefore(15)
              .build();

      given(timeBlockRepository.save(any(TimeBlock.class))).willReturn(savedBlock);

      // when
      TimeBlockResponse response = timeBlockService.createTimeBlock(userId, request);

      // then
      assertThat(response.id()).isEqualTo(1L);
      assertThat(response.subjectId()).isEqualTo(1L);
      assertThat(response.blockDate()).isEqualTo(LocalDate.of(2025, 1, 15));
      assertThat(response.startTime()).isEqualTo(LocalTime.of(9, 0));
      assertThat(response.endTime()).isEqualTo(LocalTime.of(11, 0));
      assertThat(response.durationMinutes()).isEqualTo(120);
      assertThat(response.status()).isEqualTo("INCOMPLETE");
      assertThat(response.reminderEnabled()).isTrue();
      assertThat(response.reminderMinutesBefore()).isEqualTo(15);
    }

    @Test
    @DisplayName("실패: 종료 시간이 시작 시간보다 빠른 경우")
    void createTimeBlockInvalidTimeRange() {
      // given
      Long userId = 1L;
      var request =
          new TimeBlockCreateRequest(
              1L,
              LocalDate.of(2025, 1, 15),
              LocalTime.of(11, 0),
              LocalTime.of(9, 0),
              null,
              null,
              null);

      // when & then
      assertThatThrownBy(() -> timeBlockService.createTimeBlock(userId, request))
          .isInstanceOf(BusinessException.class)
          .hasMessageContaining("종료 시간은 시작 시간 이후");
    }

    @Test
    @DisplayName("성공: reminderEnabled 기본값 true")
    void createTimeBlockDefaultReminderEnabled() {
      // given
      Long userId = 1L;
      var request =
          new TimeBlockCreateRequest(
              1L,
              LocalDate.of(2025, 1, 15),
              LocalTime.of(9, 0),
              LocalTime.of(11, 0),
              null,
              null,
              null);

      TimeBlock savedBlock =
          TimeBlock.builder()
              .id(1L)
              .userId(userId)
              .subjectId(1L)
              .blockDate(LocalDate.of(2025, 1, 15))
              .startTime(LocalTime.of(9, 0))
              .endTime(LocalTime.of(11, 0))
              .status(TimeBlockStatus.INCOMPLETE)
              .reminderEnabled(true)
              .build();

      given(timeBlockRepository.save(any(TimeBlock.class))).willReturn(savedBlock);

      // when
      TimeBlockResponse response = timeBlockService.createTimeBlock(userId, request);

      // then
      assertThat(response.reminderEnabled()).isTrue();
    }
  }

  @Nested
  @DisplayName("타임블록 조회")
  class GetTimeBlock {

    @Test
    @DisplayName("성공: 타임블록 단건 조회")
    void getTimeBlockSuccess() {
      // given
      Long timeBlockId = 1L;
      TimeBlock timeBlock =
          TimeBlock.builder()
              .id(timeBlockId)
              .userId(1L)
              .subjectId(1L)
              .blockDate(LocalDate.of(2025, 1, 15))
              .startTime(LocalTime.of(9, 0))
              .endTime(LocalTime.of(11, 0))
              .status(TimeBlockStatus.INCOMPLETE)
              .reminderEnabled(true)
              .build();

      given(timeBlockRepository.findById(timeBlockId)).willReturn(Optional.of(timeBlock));

      // when
      TimeBlockResponse response = timeBlockService.getTimeBlock(timeBlockId);

      // then
      assertThat(response.id()).isEqualTo(timeBlockId);
    }

    @Test
    @DisplayName("실패: 존재하지 않는 타임블록")
    void getTimeBlockNotFound() {
      // given
      Long timeBlockId = 999L;
      given(timeBlockRepository.findById(timeBlockId)).willReturn(Optional.empty());

      // when & then
      assertThatThrownBy(() -> timeBlockService.getTimeBlock(timeBlockId))
          .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    @DisplayName("성공: 특정 날짜 타임블록 목록 조회")
    void getTimeBlocksByDateSuccess() {
      // given
      Long userId = 1L;
      LocalDate date = LocalDate.of(2025, 1, 15);

      List<TimeBlock> blocks =
          List.of(
              TimeBlock.builder()
                  .id(1L)
                  .userId(userId)
                  .subjectId(1L)
                  .blockDate(date)
                  .startTime(LocalTime.of(9, 0))
                  .endTime(LocalTime.of(11, 0))
                  .status(TimeBlockStatus.INCOMPLETE)
                  .reminderEnabled(true)
                  .build(),
              TimeBlock.builder()
                  .id(2L)
                  .userId(userId)
                  .subjectId(2L)
                  .blockDate(date)
                  .startTime(LocalTime.of(14, 0))
                  .endTime(LocalTime.of(16, 0))
                  .status(TimeBlockStatus.COMPLETED)
                  .reminderEnabled(true)
                  .build());

      given(timeBlockRepository.findAllByUserIdAndBlockDate(userId, date)).willReturn(blocks);

      // when
      List<TimeBlockResponse> responses = timeBlockService.getTimeBlocksByDate(userId, date);

      // then
      assertThat(responses).hasSize(2);
      assertThat(responses.get(0).startTime()).isEqualTo(LocalTime.of(9, 0));
      assertThat(responses.get(1).startTime()).isEqualTo(LocalTime.of(14, 0));
    }
  }

  @Nested
  @DisplayName("타임블록 수정")
  class UpdateTimeBlock {

    @Test
    @DisplayName("성공: 타임블록 수정")
    void updateTimeBlockSuccess() {
      // given
      Long timeBlockId = 1L;
      TimeBlock existingBlock =
          TimeBlock.builder()
              .id(timeBlockId)
              .userId(1L)
              .subjectId(1L)
              .blockDate(LocalDate.of(2025, 1, 15))
              .startTime(LocalTime.of(9, 0))
              .endTime(LocalTime.of(11, 0))
              .memo("기존 메모")
              .status(TimeBlockStatus.INCOMPLETE)
              .reminderEnabled(true)
              .build();

      var request = new TimeBlockUpdateRequest(null, null, null, null, "수정된 메모", null, null, null);

      given(timeBlockRepository.findById(timeBlockId)).willReturn(Optional.of(existingBlock));
      given(timeBlockRepository.save(any(TimeBlock.class))).willAnswer(inv -> inv.getArgument(0));

      // when
      TimeBlockResponse response = timeBlockService.updateTimeBlock(timeBlockId, request);

      // then
      assertThat(response.memo()).isEqualTo("수정된 메모");
    }

    @Test
    @DisplayName("성공: 상태 변경")
    void updateTimeBlockStatusSuccess() {
      // given
      Long timeBlockId = 1L;
      TimeBlock existingBlock =
          TimeBlock.builder()
              .id(timeBlockId)
              .userId(1L)
              .subjectId(1L)
              .blockDate(LocalDate.of(2025, 1, 15))
              .startTime(LocalTime.of(9, 0))
              .endTime(LocalTime.of(11, 0))
              .status(TimeBlockStatus.INCOMPLETE)
              .reminderEnabled(true)
              .build();

      var request =
          new TimeBlockUpdateRequest(null, null, null, null, null, "COMPLETED", null, null);

      given(timeBlockRepository.findById(timeBlockId)).willReturn(Optional.of(existingBlock));
      given(timeBlockRepository.save(any(TimeBlock.class))).willAnswer(inv -> inv.getArgument(0));

      // when
      TimeBlockResponse response = timeBlockService.updateTimeBlock(timeBlockId, request);

      // then
      assertThat(response.status()).isEqualTo("COMPLETED");
    }
  }

  @Nested
  @DisplayName("타임블록 상태 변경")
  class ChangeStatus {

    @Test
    @DisplayName("성공: 타임블록 완료")
    void completeTimeBlockSuccess() {
      // given
      Long timeBlockId = 1L;
      TimeBlock existingBlock =
          TimeBlock.builder()
              .id(timeBlockId)
              .userId(1L)
              .subjectId(1L)
              .blockDate(LocalDate.of(2025, 1, 15))
              .startTime(LocalTime.of(9, 0))
              .endTime(LocalTime.of(11, 0))
              .status(TimeBlockStatus.INCOMPLETE)
              .reminderEnabled(true)
              .build();

      given(timeBlockRepository.findById(timeBlockId)).willReturn(Optional.of(existingBlock));
      given(timeBlockRepository.save(any(TimeBlock.class))).willAnswer(inv -> inv.getArgument(0));

      // when
      TimeBlockResponse response = timeBlockService.completeTimeBlock(timeBlockId);

      // then
      assertThat(response.status()).isEqualTo("COMPLETED");
    }

    @Test
    @DisplayName("성공: 타임블록 건너뛰기")
    void skipTimeBlockSuccess() {
      // given
      Long timeBlockId = 1L;
      TimeBlock existingBlock =
          TimeBlock.builder()
              .id(timeBlockId)
              .userId(1L)
              .subjectId(1L)
              .blockDate(LocalDate.of(2025, 1, 15))
              .startTime(LocalTime.of(9, 0))
              .endTime(LocalTime.of(11, 0))
              .status(TimeBlockStatus.INCOMPLETE)
              .reminderEnabled(true)
              .build();

      given(timeBlockRepository.findById(timeBlockId)).willReturn(Optional.of(existingBlock));
      given(timeBlockRepository.save(any(TimeBlock.class))).willAnswer(inv -> inv.getArgument(0));

      // when
      TimeBlockResponse response = timeBlockService.skipTimeBlock(timeBlockId);

      // then
      assertThat(response.status()).isEqualTo("SKIPPED");
    }
  }

  @Nested
  @DisplayName("타임블록 삭제")
  class DeleteTimeBlock {

    @Test
    @DisplayName("성공: 타임블록 삭제")
    void deleteTimeBlockSuccess() {
      // given
      Long timeBlockId = 1L;
      given(timeBlockRepository.existsById(timeBlockId)).willReturn(true);

      // when
      timeBlockService.deleteTimeBlock(timeBlockId);

      // then
      verify(timeBlockRepository).deleteById(timeBlockId);
    }

    @Test
    @DisplayName("실패: 존재하지 않는 타임블록 삭제")
    void deleteTimeBlockNotFound() {
      // given
      Long timeBlockId = 999L;
      given(timeBlockRepository.existsById(timeBlockId)).willReturn(false);

      // when & then
      assertThatThrownBy(() -> timeBlockService.deleteTimeBlock(timeBlockId))
          .isInstanceOf(EntityNotFoundException.class);
    }
  }

  @Nested
  @DisplayName("소유자 확인")
  class IsOwner {

    @Test
    @DisplayName("성공: 소유자 확인 - true")
    void isOwnerTrue() {
      // given
      Long timeBlockId = 1L;
      Long userId = 1L;
      TimeBlock timeBlock = TimeBlock.builder().id(timeBlockId).userId(userId).build();

      given(timeBlockRepository.findById(timeBlockId)).willReturn(Optional.of(timeBlock));

      // when
      boolean result = timeBlockService.isOwner(timeBlockId, userId);

      // then
      assertThat(result).isTrue();
    }

    @Test
    @DisplayName("성공: 소유자 확인 - false")
    void isOwnerFalse() {
      // given
      Long timeBlockId = 1L;
      Long ownerId = 1L;
      Long otherUserId = 2L;
      TimeBlock timeBlock = TimeBlock.builder().id(timeBlockId).userId(ownerId).build();

      given(timeBlockRepository.findById(timeBlockId)).willReturn(Optional.of(timeBlock));

      // when
      boolean result = timeBlockService.isOwner(timeBlockId, otherUserId);

      // then
      assertThat(result).isFalse();
    }
  }
}
