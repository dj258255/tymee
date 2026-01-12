package io.github.beom.timeblock.controller;

import io.github.beom.core.security.CurrentUser;
import io.github.beom.core.security.UserPrincipal;
import io.github.beom.core.web.ApiResponse;
import io.github.beom.timeblock.dto.TimeBlockCreateRequest;
import io.github.beom.timeblock.dto.TimeBlockResponse;
import io.github.beom.timeblock.dto.TimeBlockUpdateRequest;
import io.github.beom.timeblock.service.TimeBlockService;
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

/** 타임블록 API 컨트롤러. */
@Tag(name = "TimeBlock", description = "타임블록(공부 일정) 관리 API")
@RestController
@RequestMapping(path = "/users/{userId}/time-blocks", version = "1.0")
@RequiredArgsConstructor
public class TimeBlockController {

  private final TimeBlockService timeBlockService;

  /** POST /users/{userId}/time-blocks - 타임블록 생성 */
  @Operation(summary = "타임블록 생성", description = "새로운 타임블록(공부 일정)을 생성합니다.")
  @PostMapping
  @PreAuthorize("isAuthenticated()")
  public ApiResponse<TimeBlockResponse> createTimeBlock(
      @CurrentUser UserPrincipal currentUser,
      @PathVariable Long userId,
      @Valid @RequestBody TimeBlockCreateRequest request) {
    validateOwner(currentUser, userId);
    TimeBlockResponse response = timeBlockService.createTimeBlock(userId, request);
    return ApiResponse.success(response);
  }

  /** GET /users/{userId}/time-blocks/{timeBlockId} - 타임블록 단건 조회 */
  @Operation(summary = "타임블록 조회", description = "타임블록을 조회합니다.")
  @GetMapping("/{timeBlockId}")
  @PreAuthorize("isAuthenticated()")
  public ApiResponse<TimeBlockResponse> getTimeBlock(
      @CurrentUser UserPrincipal currentUser,
      @PathVariable Long userId,
      @PathVariable Long timeBlockId) {
    validateOwner(currentUser, userId);
    validateTimeBlockOwner(currentUser, timeBlockId);
    TimeBlockResponse response = timeBlockService.getTimeBlock(timeBlockId);
    return ApiResponse.success(response);
  }

  /** GET /users/{userId}/time-blocks?date=2025-01-01 - 특정 날짜 타임블록 목록 조회 */
  @Operation(summary = "날짜별 타임블록 목록 조회", description = "특정 날짜의 타임블록 목록을 조회합니다.")
  @GetMapping(params = "date")
  @PreAuthorize("isAuthenticated()")
  public ApiResponse<List<TimeBlockResponse>> getTimeBlocksByDate(
      @CurrentUser UserPrincipal currentUser,
      @PathVariable Long userId,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
    validateOwner(currentUser, userId);
    List<TimeBlockResponse> responses = timeBlockService.getTimeBlocksByDate(userId, date);
    return ApiResponse.success(responses);
  }

  /** GET /users/{userId}/time-blocks?startDate=2025-01-01&endDate=2025-01-07 - 기간별 타임블록 목록 조회 */
  @Operation(summary = "기간별 타임블록 목록 조회", description = "특정 기간의 타임블록 목록을 조회합니다.")
  @GetMapping(params = {"startDate", "endDate"})
  @PreAuthorize("isAuthenticated()")
  public ApiResponse<List<TimeBlockResponse>> getTimeBlocksByDateRange(
      @CurrentUser UserPrincipal currentUser,
      @PathVariable Long userId,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
    validateOwner(currentUser, userId);
    List<TimeBlockResponse> responses =
        timeBlockService.getTimeBlocksByDateRange(userId, startDate, endDate);
    return ApiResponse.success(responses);
  }

  /** PATCH /users/{userId}/time-blocks/{timeBlockId} - 타임블록 수정 */
  @Operation(summary = "타임블록 수정", description = "타임블록 정보를 수정합니다.")
  @PatchMapping("/{timeBlockId}")
  @PreAuthorize("isAuthenticated()")
  public ApiResponse<TimeBlockResponse> updateTimeBlock(
      @CurrentUser UserPrincipal currentUser,
      @PathVariable Long userId,
      @PathVariable Long timeBlockId,
      @Valid @RequestBody TimeBlockUpdateRequest request) {
    validateOwner(currentUser, userId);
    validateTimeBlockOwner(currentUser, timeBlockId);
    TimeBlockResponse response = timeBlockService.updateTimeBlock(timeBlockId, request);
    return ApiResponse.success(response);
  }

  /** POST /users/{userId}/time-blocks/{timeBlockId}/complete - 타임블록 완료 */
  @Operation(summary = "타임블록 완료", description = "타임블록을 완료 상태로 변경합니다.")
  @PostMapping("/{timeBlockId}/complete")
  @PreAuthorize("isAuthenticated()")
  public ApiResponse<TimeBlockResponse> completeTimeBlock(
      @CurrentUser UserPrincipal currentUser,
      @PathVariable Long userId,
      @PathVariable Long timeBlockId) {
    validateOwner(currentUser, userId);
    validateTimeBlockOwner(currentUser, timeBlockId);
    TimeBlockResponse response = timeBlockService.completeTimeBlock(timeBlockId);
    return ApiResponse.success(response);
  }

  /** POST /users/{userId}/time-blocks/{timeBlockId}/skip - 타임블록 건너뛰기 */
  @Operation(summary = "타임블록 건너뛰기", description = "타임블록을 건너뜀 상태로 변경합니다.")
  @PostMapping("/{timeBlockId}/skip")
  @PreAuthorize("isAuthenticated()")
  public ApiResponse<TimeBlockResponse> skipTimeBlock(
      @CurrentUser UserPrincipal currentUser,
      @PathVariable Long userId,
      @PathVariable Long timeBlockId) {
    validateOwner(currentUser, userId);
    validateTimeBlockOwner(currentUser, timeBlockId);
    TimeBlockResponse response = timeBlockService.skipTimeBlock(timeBlockId);
    return ApiResponse.success(response);
  }

  /** DELETE /users/{userId}/time-blocks/{timeBlockId} - 타임블록 삭제 */
  @Operation(summary = "타임블록 삭제", description = "타임블록을 삭제합니다.")
  @DeleteMapping("/{timeBlockId}")
  @PreAuthorize("isAuthenticated()")
  public ApiResponse<Void> deleteTimeBlock(
      @CurrentUser UserPrincipal currentUser,
      @PathVariable Long userId,
      @PathVariable Long timeBlockId) {
    validateOwner(currentUser, userId);
    validateTimeBlockOwner(currentUser, timeBlockId);
    timeBlockService.deleteTimeBlock(timeBlockId);
    return ApiResponse.success(null);
  }

  private void validateOwner(UserPrincipal currentUser, Long targetUserId) {
    if (!currentUser.userId().equals(targetUserId)) {
      throw new AccessDeniedException("본인의 타임블록만 접근할 수 있습니다");
    }
  }

  private void validateTimeBlockOwner(UserPrincipal currentUser, Long timeBlockId) {
    if (!timeBlockService.isOwner(timeBlockId, currentUser.userId())) {
      throw new AccessDeniedException("본인의 타임블록만 접근할 수 있습니다");
    }
  }
}
