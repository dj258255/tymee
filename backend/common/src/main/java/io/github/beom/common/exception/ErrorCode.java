package io.github.beom.common.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {
    // 공통 에러
    INTERNAL_SERVER_ERROR("COMMON_001", "내부 서버 오류"),
    INVALID_INPUT_VALUE("COMMON_002", "잘못된 입력값"),
    ENTITY_NOT_FOUND("COMMON_003", "엔티티를 찾을 수 없음"),
    UNAUTHORIZED("COMMON_004", "인증되지 않음"),
    FORBIDDEN("COMMON_005", "권한 없음"),

    // 카카오 로그인 관련 에러
    KAKAO_USER_INFO_FAILED("KAKAO_001", "카카오 사용자 정보 조회 실패"),
    KAKAO_INVALID_TOKEN("KAKAO_002", "유효하지 않은 카카오 액세스 토큰"),

    // 파일 업로드 관련 에러
    FILE_EMPTY("FILE_001", "파일이 비어있습니다"),
    FILE_INVALID_NAME("FILE_002", "파일명이 유효하지 않습니다"),
    FILE_INVALID_PATH("FILE_003", "잘못된 파일 경로"),
    FILE_STORE_FAILED("FILE_004", "파일 저장 실패"),
    FILE_LOAD_FAILED("FILE_005", "파일 로드 실패"),
    FILE_NOT_FOUND("FILE_006", "파일을 찾을 수 없음"),
    FILE_DELETE_FAILED("FILE_007", "파일 삭제 실패"),
    ;

    private final String code;
    private final String message;
}
