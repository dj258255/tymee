package io.github.beom.category.dto;

import io.github.beom.category.domain.Category;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;

/**
 * 카테고리 응답 DTO.
 *
 * @param id 카테고리 ID
 * @param type 카테고리 타입
 * @param parentId 상위 카테고리 ID
 * @param name 카테고리명
 * @param description 설명
 * @param iconId 아이콘 ID
 * @param sortOrder 정렬 순서
 * @param active 활성화 여부
 * @param createdAt 생성일시
 * @param children 하위 카테고리 목록 (계층 조회 시)
 */
@Builder
public record CategoryResponse(
    Long id,
    String type,
    Long parentId,
    String name,
    String description,
    Long iconId,
    Integer sortOrder,
    boolean active,
    LocalDateTime createdAt,
    List<CategoryResponse> children) {

  public static CategoryResponse from(Category domain) {
    return CategoryResponse.builder()
        .id(domain.getId())
        .type(domain.getType().name())
        .parentId(domain.getParentId())
        .name(domain.getName())
        .description(domain.getDescription())
        .iconId(domain.getIconId())
        .sortOrder(domain.getSortOrder())
        .active(domain.isActive())
        .createdAt(domain.getCreatedAt())
        .children(null)
        .build();
  }

  public static CategoryResponse fromWithChildren(
      Category domain, List<CategoryResponse> children) {
    return CategoryResponse.builder()
        .id(domain.getId())
        .type(domain.getType().name())
        .parentId(domain.getParentId())
        .name(domain.getName())
        .description(domain.getDescription())
        .iconId(domain.getIconId())
        .sortOrder(domain.getSortOrder())
        .active(domain.isActive())
        .createdAt(domain.getCreatedAt())
        .children(children)
        .build();
  }
}
