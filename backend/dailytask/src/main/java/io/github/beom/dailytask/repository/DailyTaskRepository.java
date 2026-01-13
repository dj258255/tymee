package io.github.beom.dailytask.repository;

import io.github.beom.dailytask.domain.DailyTask;
import io.github.beom.dailytask.entity.DailyTaskEntity;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

/** 일일 할일 레포지토리. */
@Repository
@RequiredArgsConstructor
public class DailyTaskRepository {

  private final DailyTaskJpaRepository jpaRepository;

  public DailyTask save(DailyTask dailyTask) {
    DailyTaskEntity entity = DailyTaskEntity.from(dailyTask);
    return jpaRepository.save(entity).toDomain();
  }

  public Optional<DailyTask> findById(Long id) {
    return jpaRepository.findByIdAndDeletedAtIsNull(id).map(DailyTaskEntity::toDomain);
  }

  public List<DailyTask> findAllByUserIdAndTaskDate(Long userId, LocalDate taskDate) {
    return jpaRepository
        .findAllByUserIdAndTaskDateAndDeletedAtIsNullOrderByPriorityDesc(userId, taskDate)
        .stream()
        .map(DailyTaskEntity::toDomain)
        .toList();
  }

  public List<DailyTask> findAllByUserIdAndTaskDateBetween(
      Long userId, LocalDate startDate, LocalDate endDate) {
    return jpaRepository
        .findAllByUserIdAndTaskDateBetweenAndDeletedAtIsNullOrderByTaskDateAscPriorityDesc(
            userId, startDate, endDate)
        .stream()
        .map(DailyTaskEntity::toDomain)
        .toList();
  }

  public List<DailyTask> findAllIncompleteByUserId(Long userId) {
    return jpaRepository
        .findAllByUserIdAndCompletedFalseAndDeletedAtIsNullOrderByTaskDateAscPriorityDesc(userId)
        .stream()
        .map(DailyTaskEntity::toDomain)
        .toList();
  }

  public List<DailyTask> findAllCompletedByUserIdAndTaskDate(Long userId, LocalDate taskDate) {
    return jpaRepository
        .findAllByUserIdAndTaskDateAndCompletedTrueAndDeletedAtIsNullOrderByPriorityDesc(
            userId, taskDate)
        .stream()
        .map(DailyTaskEntity::toDomain)
        .toList();
  }

  public List<DailyTask> findAllIncompleteByUserIdAndTaskDate(Long userId, LocalDate taskDate) {
    return jpaRepository
        .findAllByUserIdAndTaskDateAndCompletedFalseAndDeletedAtIsNullOrderByPriorityDesc(
            userId, taskDate)
        .stream()
        .map(DailyTaskEntity::toDomain)
        .toList();
  }

  public boolean existsById(Long id) {
    return jpaRepository.existsByIdAndDeletedAtIsNull(id);
  }
}
