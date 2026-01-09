package io.github.beom.user.service;

import io.github.beom.core.exception.BusinessException;
import io.github.beom.core.exception.EntityNotFoundException;
import io.github.beom.core.exception.ErrorCode;
import io.github.beom.user.domain.Report;
import io.github.beom.user.domain.vo.ReportReason;
import io.github.beom.user.domain.vo.ReportType;
import io.github.beom.user.repository.ReportRepository;
import io.github.beom.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 신고 관련 비즈니스 로직을 처리하는 서비스.
 *
 * <p>현재는 신고 생성만 지원하며, 관리자용 신고 처리 기능은 별도 모듈에서 구현 예정.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

  private final ReportRepository reportRepository;
  private final UserRepository userRepository;

  /**
   * 신고를 생성한다.
   *
   * <p>자기 자신 신고, 중복 신고를 방지한다. 사용자 신고의 경우 대상 사용자 존재 여부도 확인한다.
   */
  @Transactional
  public Report createReport(
      Long reporterId,
      ReportType targetType,
      Long targetId,
      ReportReason reason,
      String description) {

    // 자기 자신 신고 방지 (사용자 신고의 경우)
    if (targetType == ReportType.USER && reporterId.equals(targetId)) {
      throw new BusinessException(ErrorCode.SELF_REPORT_NOT_ALLOWED);
    }

    // 사용자 신고의 경우 대상 존재 여부 확인
    if (targetType == ReportType.USER && !userRepository.existsById(targetId)) {
      throw new EntityNotFoundException(ErrorCode.USER_NOT_FOUND);
    }

    // 중복 신고 방지
    if (reportRepository.existsByReporterIdAndTargetTypeAndTargetId(
        reporterId, targetType, targetId)) {
      throw new BusinessException(ErrorCode.ALREADY_REPORTED);
    }

    Report report = Report.create(reporterId, targetType, targetId, reason, description);
    return reportRepository.save(report);
  }
}
