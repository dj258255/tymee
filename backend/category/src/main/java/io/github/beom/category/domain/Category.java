package io.github.beom.category.domain;

import io.github.beom.category.domain.vo.CategoryType;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

/**
 * 카테고리 도메인 모델.
 *
 * <p>계층형 구조를 지원하며 과목, 모임, 게시글 등 다양한 용도로 사용된다.
 */
@Getter
@Builder
public class Category {

  private Long id;
  private CategoryType type;
  private Long parentId;
  private String name;
  private String description;
  private Long iconId;
  private Integer sortOrder;
  private boolean active;
  private LocalDateTime createdAt;

  /**
   * 새로운 카테고리를 생성한다.
   *
   * @param type 카테고리 타입
   * @param parentId 상위 카테고리 ID (최상위이면 null)
   * @param name 카테고리명
   * @param description 설명
   * @param iconId 아이콘 ID
   * @param sortOrder 정렬 순서
   * @return 새로운 Category 인스턴스
   */
  public static Category create(
      CategoryType type,
      Long parentId,
      String name,
      String description,
      Long iconId,
      Integer sortOrder) {
    return Category.builder()
        .type(type)
        .parentId(parentId)
        .name(name)
        .description(description)
        .iconId(iconId)
        .sortOrder(sortOrder != null ? sortOrder : 0)
        .active(true)
        .createdAt(LocalDateTime.now())
        .build();
  }

  /** 카테고리 정보를 업데이트한다. */
  public Category update(
      String name,
      String description,
      Long iconId,
      Integer sortOrder,
      Boolean active,
      Long parentId) {
    return Category.builder()
        .id(this.id)
        .type(this.type)
        .parentId(parentId != null ? parentId : this.parentId)
        .name(name != null ? name : this.name)
        .description(description != null ? description : this.description)
        .iconId(iconId != null ? iconId : this.iconId)
        .sortOrder(sortOrder != null ? sortOrder : this.sortOrder)
        .active(active != null ? active : this.active)
        .createdAt(this.createdAt)
        .build();
  }

  /** 카테고리를 비활성화한다. */
  public Category deactivate() {
    return Category.builder()
        .id(this.id)
        .type(this.type)
        .parentId(this.parentId)
        .name(this.name)
        .description(this.description)
        .iconId(this.iconId)
        .sortOrder(this.sortOrder)
        .active(false)
        .createdAt(this.createdAt)
        .build();
  }

  /** 최상위 카테고리인지 확인한다. */
  public boolean isRoot() {
    return parentId == null;
  }
}
