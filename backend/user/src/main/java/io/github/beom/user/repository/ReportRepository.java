package io.github.beom.user.repository;

import io.github.beom.user.domain.Report;
import io.github.beom.user.domain.vo.ReportType;
import io.github.beom.user.entity.ReportEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

/**
 * 신고 레포지토리.
 *
 * <p>도메인 모델과 JPA 엔티티 간 변환을 담당한다.
 */
@Repository
@RequiredArgsConstructor
public class ReportRepository {

  private final ReportJpaRepository jpaRepository;

  public Report save(Report report) {
    ReportEntity entity = ReportEntity.from(report);
    return jpaRepository.save(entity).toDomain();
  }

  public boolean existsByReporterIdAndTargetTypeAndTargetId(
      Long reporterId, ReportType targetType, Long targetId) {
    return jpaRepository.existsByReporterIdAndTargetTypeAndTargetId(
        reporterId, targetType, targetId);
  }
}
