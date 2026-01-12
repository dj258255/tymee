package io.github.beom.category.repository;

import io.github.beom.category.domain.vo.CategoryType;
import io.github.beom.category.entity.CategoryEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/** 카테고리 JPA 레포지토리. */
public interface CategoryJpaRepository extends JpaRepository<CategoryEntity, Long> {

  List<CategoryEntity> findAllByType(CategoryType type);

  List<CategoryEntity> findAllByTypeAndActiveTrue(CategoryType type);

  List<CategoryEntity> findAllByParentId(Long parentId);

  List<CategoryEntity> findAllByParentIdIsNull();

  List<CategoryEntity> findAllByTypeAndParentIdIsNull(CategoryType type);

  List<CategoryEntity> findAllByTypeAndParentIdIsNullAndActiveTrue(CategoryType type);

  boolean existsByTypeAndName(CategoryType type, String name);

  List<CategoryEntity> findAllByTypeOrderBySortOrderAsc(CategoryType type);

  List<CategoryEntity> findAllByTypeAndActiveTrueOrderBySortOrderAsc(CategoryType type);
}
