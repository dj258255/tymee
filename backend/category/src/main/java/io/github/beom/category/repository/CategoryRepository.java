package io.github.beom.category.repository;

import io.github.beom.category.domain.Category;
import io.github.beom.category.domain.vo.CategoryType;
import io.github.beom.category.entity.CategoryEntity;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

/** 카테고리 레포지토리. */
@Repository
@RequiredArgsConstructor
public class CategoryRepository {

  private final CategoryJpaRepository jpaRepository;

  public Category save(Category category) {
    CategoryEntity entity = CategoryEntity.from(category);
    return jpaRepository.save(entity).toDomain();
  }

  public Optional<Category> findById(Long id) {
    return jpaRepository.findById(id).map(CategoryEntity::toDomain);
  }

  public List<Category> findAllByType(CategoryType type) {
    return jpaRepository.findAllByType(type).stream().map(CategoryEntity::toDomain).toList();
  }

  public List<Category> findAllActiveByType(CategoryType type) {
    return jpaRepository.findAllByTypeAndActiveTrue(type).stream()
        .map(CategoryEntity::toDomain)
        .toList();
  }

  public List<Category> findAllByParentId(Long parentId) {
    return jpaRepository.findAllByParentId(parentId).stream()
        .map(CategoryEntity::toDomain)
        .toList();
  }

  public List<Category> findAllRootCategories() {
    return jpaRepository.findAllByParentIdIsNull().stream().map(CategoryEntity::toDomain).toList();
  }

  public List<Category> findAllRootCategoriesByType(CategoryType type) {
    return jpaRepository.findAllByTypeAndParentIdIsNull(type).stream()
        .map(CategoryEntity::toDomain)
        .toList();
  }

  public List<Category> findAllActiveRootCategoriesByType(CategoryType type) {
    return jpaRepository.findAllByTypeAndParentIdIsNullAndActiveTrue(type).stream()
        .map(CategoryEntity::toDomain)
        .toList();
  }

  public List<Category> findAllByTypeOrderBySortOrder(CategoryType type) {
    return jpaRepository.findAllByTypeOrderBySortOrderAsc(type).stream()
        .map(CategoryEntity::toDomain)
        .toList();
  }

  public List<Category> findAllActiveByTypeOrderBySortOrder(CategoryType type) {
    return jpaRepository.findAllByTypeAndActiveTrueOrderBySortOrderAsc(type).stream()
        .map(CategoryEntity::toDomain)
        .toList();
  }

  public boolean existsByTypeAndName(CategoryType type, String name) {
    return jpaRepository.existsByTypeAndName(type, name);
  }

  public boolean existsById(Long id) {
    return jpaRepository.existsById(id);
  }

  public void deleteById(Long id) {
    jpaRepository.deleteById(id);
  }
}
