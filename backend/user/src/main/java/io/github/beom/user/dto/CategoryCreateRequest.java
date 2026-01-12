package io.github.beom.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * 카테고리 생성 요청 DTO.
 *
 * @param type 카테고리 타입 (SUBJECT, GROUP, POST)
 * @param parentId 상위 카테고리 ID (최상위이면 null)
 * @param name 카테고리명 (필수, 최대 100자)
 * @param description 설명 (선택, 최대 255자)
 * @param iconId 아이콘 ID (선택)
 * @param sortOrder 정렬 순서 (선택, 기본 0)
 */
public record CategoryCreateRequest(
    @NotNull(message = "카테고리 타입은 필수입니다")
        @Pattern(regexp = "(?i)^(SUBJECT|GROUP|POST)$", message = "유효하지 않은 카테고리 타입입니다")
        String type,
    Long parentId,
    @NotBlank(message = "카테고리명은 필수입니다") @Size(max = 100, message = "카테고리명은 100자 이내로 입력해주세요")
        String name,
    @Size(max = 255, message = "설명은 255자 이내로 입력해주세요") String description,
    Long iconId,
    Integer sortOrder) {}
