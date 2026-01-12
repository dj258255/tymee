package io.github.beom.timeblock.repository;

import io.github.beom.timeblock.entity.TimeBlockEntity;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/** 타임블록 JPA 레포지토리. */
public interface TimeBlockJpaRepository extends JpaRepository<TimeBlockEntity, Long> {

  List<TimeBlockEntity> findAllByUserIdAndBlockDate(Long userId, LocalDate blockDate);

  List<TimeBlockEntity> findAllByUserIdAndBlockDateBetween(
      Long userId, LocalDate startDate, LocalDate endDate);

  List<TimeBlockEntity> findAllBySubjectId(Long subjectId);

  List<TimeBlockEntity> findAllByUserId(Long userId);

  void deleteAllBySubjectId(Long subjectId);

  boolean existsByUserIdAndBlockDate(Long userId, LocalDate blockDate);
}
