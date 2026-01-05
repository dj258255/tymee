package io.github.beom.user.repository;

import io.github.beom.user.domain.vo.ReportType;
import io.github.beom.user.entity.ReportEntity;
import org.springframework.data.jpa.repository.JpaRepository;

/** 신고 JPA 레포지토리. */
public interface ReportJpaRepository extends JpaRepository<ReportEntity, Long> {

  /** 동일 사용자가 동일 대상에 대해 이미 신고했는지 확인한다. 중복 신고 방지용. */
  boolean existsByReporterIdAndTargetTypeAndTargetId(
      Long reporterId, ReportType targetType, Long targetId);
}
