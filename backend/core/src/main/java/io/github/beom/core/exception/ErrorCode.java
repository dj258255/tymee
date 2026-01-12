package io.github.beom.core.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

  // Common
  INVALID_INPUT_VALUE(400, "C001", "잘못된 입력값입니다"),
  ENTITY_NOT_FOUND(404, "C002", "엔티티를 찾을 수 없습니다"),
  INTERNAL_SERVER_ERROR(500, "C003", "서버 내부 오류가 발생했습니다"),
  METHOD_NOT_ALLOWED(405, "C004", "허용되지 않은 HTTP 메서드입니다"),
  ACCESS_DENIED(403, "C005", "접근 권한이 없습니다"),

  // Auth
  INVALID_CREDENTIALS(401, "A001", "이메일 또는 비밀번호가 올바르지 않습니다"),
  TOKEN_EXPIRED(401, "A002", "토큰이 만료되었습니다"),
  TOKEN_INVALID(401, "A003", "유효하지 않은 토큰입니다"),
  REFRESH_TOKEN_NOT_FOUND(401, "A004", "리프레시 토큰을 찾을 수 없습니다"),
  UNAUTHORIZED(401, "A005", "인증이 필요합니다"),
  OAUTH_UNLINKED(400, "A006", "연동 해제된 계정입니다"),
  TOKEN_THEFT_DETECTED(401, "A007", "토큰이 탈취되었을 수 있습니다"),
  LOGIN_NOT_ALLOWED(403, "A008", "로그인할 수 없는 계정입니다"),

  // User
  USER_NOT_FOUND(404, "U001", "사용자를 찾을 수 없습니다"),
  DUPLICATE_EMAIL(409, "U002", "이미 사용 중인 이메일입니다"),
  DUPLICATE_NICKNAME(409, "U003", "이미 사용 중인 닉네임입니다"),
  USER_ALREADY_WITHDRAWN(400, "U004", "이미 탈퇴한 사용자입니다"),
  USER_SUSPENDED(403, "U005", "정지된 사용자입니다"),
  USER_BANNED(403, "U006", "차단된 사용자입니다"),
  SELF_BLOCK_NOT_ALLOWED(400, "U007", "자기 자신을 차단할 수 없습니다"),
  ALREADY_BLOCKED(409, "U008", "이미 차단한 사용자입니다"),
  SELF_REPORT_NOT_ALLOWED(400, "U009", "자기 자신을 신고할 수 없습니다"),
  ALREADY_REPORTED(409, "U010", "이미 신고한 대상입니다"),

  // Upload
  FILE_NOT_FOUND(404, "F001", "파일을 찾을 수 없습니다"),
  FILE_SIZE_EXCEEDED(400, "F002", "파일 크기가 제한을 초과했습니다"),
  UNSUPPORTED_FILE_TYPE(400, "F003", "지원하지 않는 파일 형식입니다"),
  FILE_UPLOAD_FAILED(500, "F004", "파일 업로드에 실패했습니다"),
  FILE_ALREADY_DELETED(400, "F005", "이미 삭제된 파일입니다"),

  // TimeBlock
  TIME_BLOCK_NOT_FOUND(404, "T001", "타임블록을 찾을 수 없습니다"),
  INVALID_TIME_RANGE(400, "T002", "종료 시간은 시작 시간 이후여야 합니다"),
  SUBJECT_NOT_FOUND(404, "T003", "과목을 찾을 수 없습니다");

  private final int status;
  private final String code;
  private final String message;
}
