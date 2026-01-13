package io.github.beom.dailytask.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import io.github.beom.core.exception.EntityNotFoundException;
import io.github.beom.dailytask.domain.DailyTask;
import io.github.beom.dailytask.dto.DailyTaskCreateRequest;
import io.github.beom.dailytask.dto.DailyTaskResponse;
import io.github.beom.dailytask.dto.DailyTaskUpdateRequest;
import io.github.beom.dailytask.repository.DailyTaskRepository;
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
@DisplayName("DailyTaskService 테스트")
class DailyTaskServiceTest {

  @Mock private DailyTaskRepository dailyTaskRepository;

  @InjectMocks private DailyTaskService dailyTaskService;

  @Nested
  @DisplayName("할일 생성")
  class CreateDailyTask {

    @Test
    @DisplayName("성공: 할일 생성")
    void createDailyTaskSuccess() {
      // given
      Long userId = 1L;
      var request =
          new DailyTaskCreateRequest(
              LocalDate.of(2025, 1, 15), "수학 문제 풀기", 60, 1, LocalTime.of(9, 0));

      DailyTask savedTask =
          DailyTask.builder()
              .id(1L)
              .userId(userId)
              .taskDate(LocalDate.of(2025, 1, 15))
              .title("수학 문제 풀기")
              .estimatedMinutes(60)
              .completed(false)
              .priority(1)
              .reminderTime(LocalTime.of(9, 0))
              .build();

      given(dailyTaskRepository.save(any(DailyTask.class))).willReturn(savedTask);

      // when
      DailyTaskResponse response = dailyTaskService.createDailyTask(userId, request);

      // then
      assertThat(response.id()).isEqualTo(1L);
      assertThat(response.taskDate()).isEqualTo(LocalDate.of(2025, 1, 15));
      assertThat(response.title()).isEqualTo("수학 문제 풀기");
      assertThat(response.estimatedMinutes()).isEqualTo(60);
      assertThat(response.completed()).isFalse();
      assertThat(response.priority()).isEqualTo(1);
      assertThat(response.reminderTime()).isEqualTo(LocalTime.of(9, 0));
    }

    @Test
    @DisplayName("성공: 기본 우선순위로 할일 생성")
    void createDailyTaskWithDefaultPriority() {
      // given
      Long userId = 1L;
      var request =
          new DailyTaskCreateRequest(LocalDate.of(2025, 1, 15), "영어 단어 암기", null, null, null);

      DailyTask savedTask =
          DailyTask.builder()
              .id(1L)
              .userId(userId)
              .taskDate(LocalDate.of(2025, 1, 15))
              .title("영어 단어 암기")
              .completed(false)
              .priority(0)
              .build();

      given(dailyTaskRepository.save(any(DailyTask.class))).willReturn(savedTask);

      // when
      DailyTaskResponse response = dailyTaskService.createDailyTask(userId, request);

      // then
      assertThat(response.priority()).isEqualTo(0);
    }
  }

  @Nested
  @DisplayName("할일 조회")
  class GetDailyTask {

    @Test
    @DisplayName("성공: 특정 날짜 할일 목록 조회")
    void getDailyTasksByDateSuccess() {
      // given
      Long userId = 1L;
      LocalDate date = LocalDate.of(2025, 1, 15);

      List<DailyTask> tasks =
          List.of(
              DailyTask.builder()
                  .id(1L)
                  .userId(userId)
                  .taskDate(date)
                  .title("수학 문제 풀기")
                  .completed(false)
                  .priority(2)
                  .build(),
              DailyTask.builder()
                  .id(2L)
                  .userId(userId)
                  .taskDate(date)
                  .title("영어 단어 암기")
                  .completed(true)
                  .priority(1)
                  .build());

      given(dailyTaskRepository.findAllByUserIdAndTaskDate(userId, date)).willReturn(tasks);

      // when
      List<DailyTaskResponse> responses = dailyTaskService.getDailyTasksByDate(userId, date);

      // then
      assertThat(responses).hasSize(2);
      assertThat(responses.get(0).priority()).isEqualTo(2);
      assertThat(responses.get(1).priority()).isEqualTo(1);
    }

    @Test
    @DisplayName("성공: 미완료 할일 목록 조회")
    void getIncompleteDailyTasksSuccess() {
      // given
      Long userId = 1L;

      List<DailyTask> tasks =
          List.of(
              DailyTask.builder()
                  .id(1L)
                  .userId(userId)
                  .taskDate(LocalDate.of(2025, 1, 15))
                  .title("수학 문제 풀기")
                  .completed(false)
                  .priority(1)
                  .build(),
              DailyTask.builder()
                  .id(2L)
                  .userId(userId)
                  .taskDate(LocalDate.of(2025, 1, 16))
                  .title("영어 에세이 작성")
                  .completed(false)
                  .priority(2)
                  .build());

      given(dailyTaskRepository.findAllIncompleteByUserId(userId)).willReturn(tasks);

      // when
      List<DailyTaskResponse> responses = dailyTaskService.getIncompleteDailyTasks(userId);

      // then
      assertThat(responses).hasSize(2);
      assertThat(responses).allMatch(r -> !r.completed());
    }
  }

  @Nested
  @DisplayName("할일 수정")
  class UpdateDailyTask {

    @Test
    @DisplayName("성공: 할일 수정")
    void updateDailyTaskSuccess() {
      // given
      Long dailyTaskId = 1L;
      DailyTask existingTask =
          DailyTask.builder()
              .id(dailyTaskId)
              .userId(1L)
              .taskDate(LocalDate.of(2025, 1, 15))
              .title("기존 제목")
              .completed(false)
              .priority(0)
              .build();

      var request = new DailyTaskUpdateRequest(null, "수정된 제목", 90, null, 3, null);

      given(dailyTaskRepository.findById(dailyTaskId)).willReturn(Optional.of(existingTask));
      given(dailyTaskRepository.save(any(DailyTask.class))).willAnswer(inv -> inv.getArgument(0));

      // when
      DailyTaskResponse response = dailyTaskService.updateDailyTask(dailyTaskId, request);

      // then
      assertThat(response.title()).isEqualTo("수정된 제목");
      assertThat(response.estimatedMinutes()).isEqualTo(90);
      assertThat(response.priority()).isEqualTo(3);
    }
  }

  @Nested
  @DisplayName("할일 상태 변경")
  class ChangeStatus {

    @Test
    @DisplayName("성공: 할일 완료")
    void completeDailyTaskSuccess() {
      // given
      Long dailyTaskId = 1L;
      DailyTask existingTask =
          DailyTask.builder()
              .id(dailyTaskId)
              .userId(1L)
              .taskDate(LocalDate.of(2025, 1, 15))
              .title("수학 문제 풀기")
              .completed(false)
              .priority(1)
              .build();

      given(dailyTaskRepository.findById(dailyTaskId)).willReturn(Optional.of(existingTask));
      given(dailyTaskRepository.save(any(DailyTask.class))).willAnswer(inv -> inv.getArgument(0));

      // when
      DailyTaskResponse response = dailyTaskService.completeDailyTask(dailyTaskId);

      // then
      assertThat(response.completed()).isTrue();
    }

    @Test
    @DisplayName("성공: 할일 미완료로 변경")
    void uncompleteDailyTaskSuccess() {
      // given
      Long dailyTaskId = 1L;
      DailyTask existingTask =
          DailyTask.builder()
              .id(dailyTaskId)
              .userId(1L)
              .taskDate(LocalDate.of(2025, 1, 15))
              .title("수학 문제 풀기")
              .completed(true)
              .priority(1)
              .build();

      given(dailyTaskRepository.findById(dailyTaskId)).willReturn(Optional.of(existingTask));
      given(dailyTaskRepository.save(any(DailyTask.class))).willAnswer(inv -> inv.getArgument(0));

      // when
      DailyTaskResponse response = dailyTaskService.uncompleteDailyTask(dailyTaskId);

      // then
      assertThat(response.completed()).isFalse();
    }
  }

  @Nested
  @DisplayName("할일 삭제")
  class DeleteDailyTask {

    @Test
    @DisplayName("성공: 할일 소프트 삭제")
    void deleteDailyTaskSuccess() {
      // given
      Long dailyTaskId = 1L;
      DailyTask existingTask =
          DailyTask.builder()
              .id(dailyTaskId)
              .userId(1L)
              .taskDate(LocalDate.of(2025, 1, 15))
              .title("수학 문제 풀기")
              .completed(false)
              .priority(1)
              .build();

      given(dailyTaskRepository.findById(dailyTaskId)).willReturn(Optional.of(existingTask));
      given(dailyTaskRepository.save(any(DailyTask.class))).willAnswer(inv -> inv.getArgument(0));

      // when
      dailyTaskService.deleteDailyTask(dailyTaskId);

      // then
      verify(dailyTaskRepository).save(any(DailyTask.class));
    }

    @Test
    @DisplayName("실패: 존재하지 않는 할일 삭제")
    void deleteDailyTaskNotFound() {
      // given
      Long dailyTaskId = 999L;
      given(dailyTaskRepository.findById(dailyTaskId)).willReturn(Optional.empty());

      // when & then
      assertThatThrownBy(() -> dailyTaskService.deleteDailyTask(dailyTaskId))
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
      Long dailyTaskId = 1L;
      Long userId = 1L;
      DailyTask dailyTask = DailyTask.builder().id(dailyTaskId).userId(userId).build();

      given(dailyTaskRepository.findById(dailyTaskId)).willReturn(Optional.of(dailyTask));

      // when
      boolean result = dailyTaskService.isOwner(dailyTaskId, userId);

      // then
      assertThat(result).isTrue();
    }

    @Test
    @DisplayName("성공: 소유자 확인 - false")
    void isOwnerFalse() {
      // given
      Long dailyTaskId = 1L;
      Long ownerId = 1L;
      Long otherUserId = 2L;
      DailyTask dailyTask = DailyTask.builder().id(dailyTaskId).userId(ownerId).build();

      given(dailyTaskRepository.findById(dailyTaskId)).willReturn(Optional.of(dailyTask));

      // when
      boolean result = dailyTaskService.isOwner(dailyTaskId, otherUserId);

      // then
      assertThat(result).isFalse();
    }
  }
}
