package io.github.beom.dailytask.controller;

import io.github.beom.core.security.CurrentUser;
import io.github.beom.core.security.UserPrincipal;
import io.github.beom.core.web.ApiResponse;
import io.github.beom.dailytask.dto.DailyTaskCreateRequest;
import io.github.beom.dailytask.dto.DailyTaskResponse;
import io.github.beom.dailytask.dto.DailyTaskUpdateRequest;
import io.github.beom.dailytask.service.DailyTaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** 일일 할일 API 컨트롤러. */
@Tag(name = "DailyTask", description = "일일 할일 관리 API")
@RestController
@RequestMapping(path = "/users/{userId}/daily-tasks", version = "1.0")
@RequiredArgsConstructor
public class DailyTaskController {

  private final DailyTaskService dailyTaskService;

  /** POST /users/{userId}/daily-tasks - 할일 생성 */
  @Operation(summary = "할일 생성", description = "새로운 일일 할일을 생성합니다.")
  @PostMapping
  @PreAuthorize("isAuthenticated()")
  public ApiResponse<DailyTaskResponse> createDailyTask(
      @CurrentUser UserPrincipal currentUser,
      @PathVariable Long userId,
      @Valid @RequestBody DailyTaskCreateRequest request) {
    validateOwner(currentUser, userId);
    DailyTaskResponse response = dailyTaskService.createDailyTask(userId, request);
    return ApiResponse.success(response);
  }

  /** GET /users/{userId}/daily-tasks?date=2025-01-01 - 특정 날짜 할일 목록 조회 */
  @Operation(summary = "날짜별 할일 목록 조회", description = "특정 날짜의 할일 목록을 조회합니다.")
  @GetMapping(params = "date")
  @PreAuthorize("isAuthenticated()")
  public ApiResponse<List<DailyTaskResponse>> getDailyTasksByDate(
      @CurrentUser UserPrincipal currentUser,
      @PathVariable Long userId,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
    validateOwner(currentUser, userId);
    List<DailyTaskResponse> responses = dailyTaskService.getDailyTasksByDate(userId, date);
    return ApiResponse.success(responses);
  }

  /** GET /users/{userId}/daily-tasks?startDate=2025-01-01&endDate=2025-01-07 - 기간별 할일 목록 조회 */
  @Operation(summary = "기간별 할일 목록 조회", description = "특정 기간의 할일 목록을 조회합니다.")
  @GetMapping(params = {"startDate", "endDate"})
  @PreAuthorize("isAuthenticated()")
  public ApiResponse<List<DailyTaskResponse>> getDailyTasksByDateRange(
      @CurrentUser UserPrincipal currentUser,
      @PathVariable Long userId,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
    validateOwner(currentUser, userId);
    List<DailyTaskResponse> responses =
        dailyTaskService.getDailyTasksByDateRange(userId, startDate, endDate);
    return ApiResponse.success(responses);
  }

  /** GET /users/{userId}/daily-tasks/incomplete - 미완료 할일 목록 조회 */
  @Operation(summary = "미완료 할일 목록 조회", description = "미완료된 모든 할일 목록을 조회합니다.")
  @GetMapping("/incomplete")
  @PreAuthorize("isAuthenticated()")
  public ApiResponse<List<DailyTaskResponse>> getIncompleteDailyTasks(
      @CurrentUser UserPrincipal currentUser, @PathVariable Long userId) {
    validateOwner(currentUser, userId);
    List<DailyTaskResponse> responses = dailyTaskService.getIncompleteDailyTasks(userId);
    return ApiResponse.success(responses);
  }

  /** PATCH /users/{userId}/daily-tasks/{dailyTaskId} - 할일 수정 */
  @Operation(summary = "할일 수정", description = "할일 정보를 수정합니다.")
  @PatchMapping("/{dailyTaskId}")
  @PreAuthorize("isAuthenticated()")
  public ApiResponse<DailyTaskResponse> updateDailyTask(
      @CurrentUser UserPrincipal currentUser,
      @PathVariable Long userId,
      @PathVariable Long dailyTaskId,
      @Valid @RequestBody DailyTaskUpdateRequest request) {
    validateOwner(currentUser, userId);
    validateDailyTaskOwner(currentUser, dailyTaskId);
    DailyTaskResponse response = dailyTaskService.updateDailyTask(dailyTaskId, request);
    return ApiResponse.success(response);
  }

  /** POST /users/{userId}/daily-tasks/{dailyTaskId}/complete - 할일 완료 */
  @Operation(summary = "할일 완료", description = "할일을 완료 상태로 변경합니다.")
  @PostMapping("/{dailyTaskId}/complete")
  @PreAuthorize("isAuthenticated()")
  public ApiResponse<DailyTaskResponse> completeDailyTask(
      @CurrentUser UserPrincipal currentUser,
      @PathVariable Long userId,
      @PathVariable Long dailyTaskId) {
    validateOwner(currentUser, userId);
    validateDailyTaskOwner(currentUser, dailyTaskId);
    DailyTaskResponse response = dailyTaskService.completeDailyTask(dailyTaskId);
    return ApiResponse.success(response);
  }

  /** POST /users/{userId}/daily-tasks/{dailyTaskId}/uncomplete - 할일 미완료 */
  @Operation(summary = "할일 미완료", description = "할일을 미완료 상태로 변경합니다.")
  @PostMapping("/{dailyTaskId}/uncomplete")
  @PreAuthorize("isAuthenticated()")
  public ApiResponse<DailyTaskResponse> uncompleteDailyTask(
      @CurrentUser UserPrincipal currentUser,
      @PathVariable Long userId,
      @PathVariable Long dailyTaskId) {
    validateOwner(currentUser, userId);
    validateDailyTaskOwner(currentUser, dailyTaskId);
    DailyTaskResponse response = dailyTaskService.uncompleteDailyTask(dailyTaskId);
    return ApiResponse.success(response);
  }

  /** DELETE /users/{userId}/daily-tasks/{dailyTaskId} - 할일 삭제 */
  @Operation(summary = "할일 삭제", description = "할일을 삭제합니다. (소프트 삭제)")
  @DeleteMapping("/{dailyTaskId}")
  @PreAuthorize("isAuthenticated()")
  public ApiResponse<Void> deleteDailyTask(
      @CurrentUser UserPrincipal currentUser,
      @PathVariable Long userId,
      @PathVariable Long dailyTaskId) {
    validateOwner(currentUser, userId);
    validateDailyTaskOwner(currentUser, dailyTaskId);
    dailyTaskService.deleteDailyTask(dailyTaskId);
    return ApiResponse.success(null);
  }

  private void validateOwner(UserPrincipal currentUser, Long targetUserId) {
    if (!currentUser.userId().equals(targetUserId)) {
      throw new AccessDeniedException("본인의 할일만 접근할 수 있습니다");
    }
  }

  private void validateDailyTaskOwner(UserPrincipal currentUser, Long dailyTaskId) {
    if (!dailyTaskService.isOwner(dailyTaskId, currentUser.userId())) {
      throw new AccessDeniedException("본인의 할일만 접근할 수 있습니다");
    }
  }
}
