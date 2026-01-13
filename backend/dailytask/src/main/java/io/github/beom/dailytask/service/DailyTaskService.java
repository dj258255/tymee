package io.github.beom.dailytask.service;

import io.github.beom.core.exception.EntityNotFoundException;
import io.github.beom.core.exception.ErrorCode;
import io.github.beom.dailytask.domain.DailyTask;
import io.github.beom.dailytask.dto.DailyTaskCreateRequest;
import io.github.beom.dailytask.dto.DailyTaskResponse;
import io.github.beom.dailytask.dto.DailyTaskUpdateRequest;
import io.github.beom.dailytask.repository.DailyTaskRepository;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 일일 할일 관련 비즈니스 로직을 처리하는 서비스. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DailyTaskService {

  private final DailyTaskRepository dailyTaskRepository;

  /**
   * 일일 할일을 생성한다.
   *
   * @param userId 사용자 ID
   * @param request 생성 요청
   * @return 생성된 할일 응답
   */
  @Transactional
  public DailyTaskResponse createDailyTask(Long userId, DailyTaskCreateRequest request) {
    DailyTask dailyTask =
        DailyTask.create(
            userId,
            request.taskDate(),
            request.title(),
            request.estimatedMinutes(),
            request.priority(),
            request.reminderTime());

    DailyTask saved = dailyTaskRepository.save(dailyTask);
    return DailyTaskResponse.from(saved);
  }

  /**
   * 특정 날짜의 할일 목록을 조회한다.
   *
   * @param userId 사용자 ID
   * @param date 조회할 날짜
   * @return 할일 목록
   */
  public List<DailyTaskResponse> getDailyTasksByDate(Long userId, LocalDate date) {
    return dailyTaskRepository.findAllByUserIdAndTaskDate(userId, date).stream()
        .map(DailyTaskResponse::from)
        .toList();
  }

  /**
   * 날짜 범위의 할일 목록을 조회한다.
   *
   * @param userId 사용자 ID
   * @param startDate 시작 날짜
   * @param endDate 종료 날짜
   * @return 할일 목록
   */
  public List<DailyTaskResponse> getDailyTasksByDateRange(
      Long userId, LocalDate startDate, LocalDate endDate) {
    return dailyTaskRepository
        .findAllByUserIdAndTaskDateBetween(userId, startDate, endDate)
        .stream()
        .map(DailyTaskResponse::from)
        .toList();
  }

  /**
   * 미완료 할일 목록을 조회한다.
   *
   * @param userId 사용자 ID
   * @return 미완료 할일 목록
   */
  public List<DailyTaskResponse> getIncompleteDailyTasks(Long userId) {
    return dailyTaskRepository.findAllIncompleteByUserId(userId).stream()
        .map(DailyTaskResponse::from)
        .toList();
  }

  /**
   * 특정 날짜의 완료된 할일 목록을 조회한다.
   *
   * @param userId 사용자 ID
   * @param date 조회할 날짜
   * @return 완료된 할일 목록
   */
  public List<DailyTaskResponse> getCompletedDailyTasksByDate(Long userId, LocalDate date) {
    return dailyTaskRepository.findAllCompletedByUserIdAndTaskDate(userId, date).stream()
        .map(DailyTaskResponse::from)
        .toList();
  }

  /**
   * 특정 날짜의 미완료 할일 목록을 조회한다.
   *
   * @param userId 사용자 ID
   * @param date 조회할 날짜
   * @return 미완료 할일 목록
   */
  public List<DailyTaskResponse> getIncompleteDailyTasksByDate(Long userId, LocalDate date) {
    return dailyTaskRepository.findAllIncompleteByUserIdAndTaskDate(userId, date).stream()
        .map(DailyTaskResponse::from)
        .toList();
  }

  /**
   * 할일을 수정한다.
   *
   * @param dailyTaskId 할일 ID
   * @param request 수정 요청
   * @return 수정된 할일 응답
   */
  @Transactional
  public DailyTaskResponse updateDailyTask(Long dailyTaskId, DailyTaskUpdateRequest request) {
    DailyTask dailyTask = findDailyTaskOrThrow(dailyTaskId);

    DailyTask updated =
        dailyTask.update(
            request.taskDate(),
            request.title(),
            request.estimatedMinutes(),
            request.completed(),
            request.priority(),
            request.reminderTime());

    DailyTask saved = dailyTaskRepository.save(updated);
    return DailyTaskResponse.from(saved);
  }

  /**
   * 할일을 완료 상태로 변경한다.
   *
   * @param dailyTaskId 할일 ID
   * @return 수정된 할일 응답
   */
  @Transactional
  public DailyTaskResponse completeDailyTask(Long dailyTaskId) {
    DailyTask dailyTask = findDailyTaskOrThrow(dailyTaskId);
    DailyTask completed = dailyTask.complete();
    DailyTask saved = dailyTaskRepository.save(completed);
    return DailyTaskResponse.from(saved);
  }

  /**
   * 할일을 미완료 상태로 변경한다.
   *
   * @param dailyTaskId 할일 ID
   * @return 수정된 할일 응답
   */
  @Transactional
  public DailyTaskResponse uncompleteDailyTask(Long dailyTaskId) {
    DailyTask dailyTask = findDailyTaskOrThrow(dailyTaskId);
    DailyTask uncompleted = dailyTask.uncomplete();
    DailyTask saved = dailyTaskRepository.save(uncompleted);
    return DailyTaskResponse.from(saved);
  }

  /**
   * 할일을 삭제한다. (소프트 삭제)
   *
   * @param dailyTaskId 할일 ID
   */
  @Transactional
  public void deleteDailyTask(Long dailyTaskId) {
    DailyTask dailyTask = findDailyTaskOrThrow(dailyTaskId);
    DailyTask deleted = dailyTask.softDelete();
    dailyTaskRepository.save(deleted);
  }

  /**
   * 할일의 소유자인지 확인한다.
   *
   * @param dailyTaskId 할일 ID
   * @param userId 사용자 ID
   * @return 소유자 여부
   */
  public boolean isOwner(Long dailyTaskId, Long userId) {
    return dailyTaskRepository
        .findById(dailyTaskId)
        .map(task -> task.getUserId().equals(userId))
        .orElse(false);
  }

  private DailyTask findDailyTaskOrThrow(Long dailyTaskId) {
    return dailyTaskRepository
        .findById(dailyTaskId)
        .orElseThrow(() -> new EntityNotFoundException(ErrorCode.DAILY_TASK_NOT_FOUND));
  }
}
