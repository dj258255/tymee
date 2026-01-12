package io.github.beom.user.entity;

import io.github.beom.user.domain.Category;
import io.github.beom.user.domain.vo.CategoryType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

/**
 * 카테고리 JPA 엔티티.
 *
 * <p>계층형 구조를 지원하며 parent_id로 자기참조한다. type으로 용도를 구분한다.
 */
@Entity
@Table(
    name = "categories",
    indexes = {
      @Index(name = "idx_categories_type", columnList = "type"),
      @Index(name = "idx_categories_parent", columnList = "parent_id")
    })
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CategoryEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Enumerated(EnumType.STRING)
  @Column(name = "type", nullable = false, length = 50)
  private CategoryType type;

  @Column(name = "parent_id")
  private Long parentId;

  @Column(name = "name", nullable = false, length = 100)
  private String name;

  @Column(name = "description")
  private String description;

  @Column(name = "icon_id")
  private Long iconId;

  @Column(name = "sort_order")
  private Integer sortOrder;

  @Column(name = "is_active")
  private boolean active;

  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  @Builder
  public CategoryEntity(
      Long id,
      CategoryType type,
      Long parentId,
      String name,
      String description,
      Long iconId,
      Integer sortOrder,
      boolean active,
      LocalDateTime createdAt) {
    this.id = id;
    this.type = type;
    this.parentId = parentId;
    this.name = name;
    this.description = description;
    this.iconId = iconId;
    this.sortOrder = sortOrder;
    this.active = active;
    this.createdAt = createdAt;
  }

  /** 도메인 모델을 엔티티로 변환한다. */
  public static CategoryEntity from(Category domain) {
    return CategoryEntity.builder()
        .id(domain.getId())
        .type(domain.getType())
        .parentId(domain.getParentId())
        .name(domain.getName())
        .description(domain.getDescription())
        .iconId(domain.getIconId())
        .sortOrder(domain.getSortOrder())
        .active(domain.isActive())
        .createdAt(domain.getCreatedAt())
        .build();
  }

  /** 엔티티를 도메인 모델로 변환한다. */
  public Category toDomain() {
    return Category.builder()
        .id(id)
        .type(type)
        .parentId(parentId)
        .name(name)
        .description(description)
        .iconId(iconId)
        .sortOrder(sortOrder)
        .active(active)
        .createdAt(createdAt)
        .build();
  }
}
