package io.github.beom.dailytask.repository;

import io.github.beom.dailytask.entity.DailyTaskEntity;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/** 일일 할일 JPA Repository. */
public interface DailyTaskJpaRepository extends JpaRepository<DailyTaskEntity, Long> {

  /** 삭제되지 않은 할일을 ID로 조회한다. */
  Optional<DailyTaskEntity> findByIdAndDeletedAtIsNull(Long id);

  /** 특정 사용자의 특정 날짜 할일 목록을 우선순위 내림차순으로 조회한다. (삭제되지 않은 것만) */
  List<DailyTaskEntity> findAllByUserIdAndTaskDateAndDeletedAtIsNullOrderByPriorityDesc(
      Long userId, LocalDate taskDate);

  /** 특정 사용자의 기간 내 할일 목록을 조회한다. (삭제되지 않은 것만) */
  List<DailyTaskEntity>
      findAllByUserIdAndTaskDateBetweenAndDeletedAtIsNullOrderByTaskDateAscPriorityDesc(
          Long userId, LocalDate startDate, LocalDate endDate);

  /** 특정 사용자의 미완료 할일 목록을 조회한다. (삭제되지 않은 것만) */
  List<DailyTaskEntity>
      findAllByUserIdAndCompletedFalseAndDeletedAtIsNullOrderByTaskDateAscPriorityDesc(Long userId);

  /** 특정 사용자의 특정 날짜 완료된 할일 목록을 조회한다. (삭제되지 않은 것만) */
  List<DailyTaskEntity>
      findAllByUserIdAndTaskDateAndCompletedTrueAndDeletedAtIsNullOrderByPriorityDesc(
          Long userId, LocalDate taskDate);

  /** 특정 사용자의 특정 날짜 미완료 할일 목록을 조회한다. (삭제되지 않은 것만) */
  List<DailyTaskEntity>
      findAllByUserIdAndTaskDateAndCompletedFalseAndDeletedAtIsNullOrderByPriorityDesc(
          Long userId, LocalDate taskDate);

  /** 해당 ID의 삭제되지 않은 할일이 존재하는지 확인한다. */
  boolean existsByIdAndDeletedAtIsNull(Long id);
}
