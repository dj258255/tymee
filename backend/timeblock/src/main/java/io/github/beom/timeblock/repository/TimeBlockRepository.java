package io.github.beom.timeblock.repository;

import io.github.beom.timeblock.domain.TimeBlock;
import io.github.beom.timeblock.entity.TimeBlockEntity;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

/** 타임블록 레포지토리. */
@Repository
@RequiredArgsConstructor
public class TimeBlockRepository {

  private final TimeBlockJpaRepository jpaRepository;

  public TimeBlock save(TimeBlock timeBlock) {
    TimeBlockEntity entity = TimeBlockEntity.from(timeBlock);
    return jpaRepository.save(entity).toDomain();
  }

  public Optional<TimeBlock> findById(Long id) {
    return jpaRepository.findById(id).map(TimeBlockEntity::toDomain);
  }

  public List<TimeBlock> findAllByUserIdAndBlockDate(Long userId, LocalDate blockDate) {
    return jpaRepository.findAllByUserIdAndBlockDate(userId, blockDate).stream()
        .map(TimeBlockEntity::toDomain)
        .toList();
  }

  public List<TimeBlock> findAllByUserIdAndBlockDateBetween(
      Long userId, LocalDate startDate, LocalDate endDate) {
    return jpaRepository.findAllByUserIdAndBlockDateBetween(userId, startDate, endDate).stream()
        .map(TimeBlockEntity::toDomain)
        .toList();
  }

  public List<TimeBlock> findAllBySubjectId(Long subjectId) {
    return jpaRepository.findAllBySubjectId(subjectId).stream()
        .map(TimeBlockEntity::toDomain)
        .toList();
  }

  public List<TimeBlock> findAllByUserId(Long userId) {
    return jpaRepository.findAllByUserId(userId).stream().map(TimeBlockEntity::toDomain).toList();
  }

  public void deleteById(Long id) {
    jpaRepository.deleteById(id);
  }

  public void deleteAllBySubjectId(Long subjectId) {
    jpaRepository.deleteAllBySubjectId(subjectId);
  }

  public boolean existsById(Long id) {
    return jpaRepository.existsById(id);
  }
}
