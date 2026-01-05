package io.github.beom.user.controller;

import io.github.beom.core.web.ApiResponse;
import io.github.beom.user.dto.CreateReportRequest;
import io.github.beom.user.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 신고 API 컨트롤러.
 *
 * <p>사용자/게시글/댓글 신고를 통합 처리한다.
 */
@RestController
@RequestMapping(path = "/reports", version = "1")
@RequiredArgsConstructor
public class ReportController {

  private final ReportService reportService;

  /** POST /reports - 신고 생성 */
  @PostMapping
  public ApiResponse<Void> createReport(@Valid @RequestBody CreateReportRequest request) {
    reportService.createReport(
        request.reporterId(),
        request.targetType(),
        request.targetId(),
        request.reason(),
        request.description());
    return ApiResponse.success(null);
  }
}
