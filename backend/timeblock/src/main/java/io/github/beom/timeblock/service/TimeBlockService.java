package io.github.beom.timeblock.service;

import io.github.beom.core.exception.BusinessException;
import io.github.beom.core.exception.EntityNotFoundException;
import io.github.beom.core.exception.ErrorCode;
import io.github.beom.timeblock.domain.TimeBlock;
import io.github.beom.timeblock.domain.vo.TimeBlockStatus;
import io.github.beom.timeblock.dto.TimeBlockCreateRequest;
import io.github.beom.timeblock.dto.TimeBlockResponse;
import io.github.beom.timeblock.dto.TimeBlockUpdateRequest;
import io.github.beom.timeblock.repository.TimeBlockRepository;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 타임블록 관련 비즈니스 로직을 처리하는 서비스. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TimeBlockService {

  private final TimeBlockRepository timeBlockRepository;

  /**
   * 타임블록을 생성한다.
   *
   * @param userId 사용자 ID
   * @param request 생성 요청
   * @return 생성된 타임블록 응답
   */
  @Transactional
  public TimeBlockResponse createTimeBlock(Long userId, TimeBlockCreateRequest request) {
    validateTimeRange(request.startTime(), request.endTime());

    boolean reminderEnabled = request.reminderEnabled() != null ? request.reminderEnabled() : true;

    TimeBlock timeBlock =
        TimeBlock.create(
            userId,
            request.subjectId(),
            request.blockDate(),
            request.startTime(),
            request.endTime(),
            request.memo(),
            reminderEnabled,
            request.reminderMinutesBefore());

    TimeBlock saved = timeBlockRepository.save(timeBlock);
    return TimeBlockResponse.from(saved);
  }

  /**
   * 타임블록을 조회한다.
   *
   * @param timeBlockId 타임블록 ID
   * @return 타임블록 응답
   */
  public TimeBlockResponse getTimeBlock(Long timeBlockId) {
    TimeBlock timeBlock = findTimeBlockOrThrow(timeBlockId);
    return TimeBlockResponse.from(timeBlock);
  }

  /**
   * 특정 날짜의 타임블록 목록을 조회한다.
   *
   * @param userId 사용자 ID
   * @param date 조회할 날짜
   * @return 타임블록 목록
   */
  public List<TimeBlockResponse> getTimeBlocksByDate(Long userId, LocalDate date) {
    return timeBlockRepository.findAllByUserIdAndBlockDate(userId, date).stream()
        .map(TimeBlockResponse::from)
        .toList();
  }

  /**
   * 날짜 범위의 타임블록 목록을 조회한다.
   *
   * @param userId 사용자 ID
   * @param startDate 시작 날짜
   * @param endDate 종료 날짜
   * @return 타임블록 목록
   */
  public List<TimeBlockResponse> getTimeBlocksByDateRange(
      Long userId, LocalDate startDate, LocalDate endDate) {
    return timeBlockRepository
        .findAllByUserIdAndBlockDateBetween(userId, startDate, endDate)
        .stream()
        .map(TimeBlockResponse::from)
        .toList();
  }

  /**
   * 타임블록을 수정한다.
   *
   * @param timeBlockId 타임블록 ID
   * @param request 수정 요청
   * @return 수정된 타임블록 응답
   */
  @Transactional
  public TimeBlockResponse updateTimeBlock(Long timeBlockId, TimeBlockUpdateRequest request) {
    TimeBlock timeBlock = findTimeBlockOrThrow(timeBlockId);

    // 시간 범위 검증 (둘 다 제공된 경우)
    if (request.startTime() != null && request.endTime() != null) {
      validateTimeRange(request.startTime(), request.endTime());
    } else if (request.startTime() != null) {
      validateTimeRange(request.startTime(), timeBlock.getEndTime());
    } else if (request.endTime() != null) {
      validateTimeRange(timeBlock.getStartTime(), request.endTime());
    }

    TimeBlockStatus status = null;
    if (request.status() != null) {
      status = TimeBlockStatus.valueOf(request.status().toUpperCase());
    }

    TimeBlock updated =
        timeBlock.update(
            request.subjectId(),
            request.blockDate(),
            request.startTime(),
            request.endTime(),
            request.memo(),
            status,
            request.reminderEnabled(),
            request.reminderMinutesBefore());

    TimeBlock saved = timeBlockRepository.save(updated);
    return TimeBlockResponse.from(saved);
  }

  /**
   * 타임블록을 완료 상태로 변경한다.
   *
   * @param timeBlockId 타임블록 ID
   * @return 수정된 타임블록 응답
   */
  @Transactional
  public TimeBlockResponse completeTimeBlock(Long timeBlockId) {
    TimeBlock timeBlock = findTimeBlockOrThrow(timeBlockId);
    TimeBlock completed = timeBlock.complete();
    TimeBlock saved = timeBlockRepository.save(completed);
    return TimeBlockResponse.from(saved);
  }

  /**
   * 타임블록을 건너뜀 상태로 변경한다.
   *
   * @param timeBlockId 타임블록 ID
   * @return 수정된 타임블록 응답
   */
  @Transactional
  public TimeBlockResponse skipTimeBlock(Long timeBlockId) {
    TimeBlock timeBlock = findTimeBlockOrThrow(timeBlockId);
    TimeBlock skipped = timeBlock.skip();
    TimeBlock saved = timeBlockRepository.save(skipped);
    return TimeBlockResponse.from(saved);
  }

  /**
   * 타임블록을 삭제한다.
   *
   * @param timeBlockId 타임블록 ID
   */
  @Transactional
  public void deleteTimeBlock(Long timeBlockId) {
    if (!timeBlockRepository.existsById(timeBlockId)) {
      throw new EntityNotFoundException(ErrorCode.TIME_BLOCK_NOT_FOUND);
    }
    timeBlockRepository.deleteById(timeBlockId);
  }

  /**
   * 타임블록의 소유자인지 확인한다.
   *
   * @param timeBlockId 타임블록 ID
   * @param userId 사용자 ID
   * @return 소유자 여부
   */
  public boolean isOwner(Long timeBlockId, Long userId) {
    return timeBlockRepository
        .findById(timeBlockId)
        .map(block -> block.getUserId().equals(userId))
        .orElse(false);
  }

  private TimeBlock findTimeBlockOrThrow(Long timeBlockId) {
    return timeBlockRepository
        .findById(timeBlockId)
        .orElseThrow(() -> new EntityNotFoundException(ErrorCode.TIME_BLOCK_NOT_FOUND));
  }

  private void validateTimeRange(java.time.LocalTime startTime, java.time.LocalTime endTime) {
    if (!endTime.isAfter(startTime)) {
      throw new BusinessException(ErrorCode.INVALID_TIME_RANGE);
    }
  }
}
