package io.github.beom.category.dto;

import jakarta.validation.constraints.Size;

/**
 * 카테고리 수정 요청 DTO.
 *
 * <p>모든 필드가 선택적이며, null이 아닌 값만 업데이트한다.
 *
 * @param parentId 상위 카테고리 ID
 * @param name 카테고리명 (최대 100자)
 * @param description 설명 (최대 255자)
 * @param iconId 아이콘 ID
 * @param sortOrder 정렬 순서
 * @param active 활성화 여부
 */
public record CategoryUpdateRequest(
    Long parentId,
    @Size(max = 100, message = "카테고리명은 100자 이내로 입력해주세요") String name,
    @Size(max = 255, message = "설명은 255자 이내로 입력해주세요") String description,
    Long iconId,
    Integer sortOrder,
    Boolean active) {}
