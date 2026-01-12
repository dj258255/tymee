package io.github.beom.user.service;

import io.github.beom.core.exception.BusinessException;
import io.github.beom.core.exception.EntityNotFoundException;
import io.github.beom.core.exception.ErrorCode;
import io.github.beom.user.domain.Category;
import io.github.beom.user.domain.vo.CategoryType;
import io.github.beom.user.dto.CategoryCreateRequest;
import io.github.beom.user.dto.CategoryResponse;
import io.github.beom.user.dto.CategoryUpdateRequest;
import io.github.beom.user.repository.CategoryRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 카테고리 관련 비즈니스 로직을 처리하는 서비스. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

  private final CategoryRepository categoryRepository;

  /**
   * 카테고리를 생성한다.
   *
   * @param request 생성 요청
   * @return 생성된 카테고리 응답
   */
  @Transactional
  public CategoryResponse createCategory(CategoryCreateRequest request) {
    CategoryType type = CategoryType.valueOf(request.type().toUpperCase());

    // 중복 이름 체크
    if (categoryRepository.existsByTypeAndName(type, request.name())) {
      throw new BusinessException(ErrorCode.DUPLICATE_CATEGORY_NAME);
    }

    // 상위 카테고리 검증
    if (request.parentId() != null) {
      Category parent =
          categoryRepository
              .findById(request.parentId())
              .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_PARENT_CATEGORY));

      // 상위 카테고리의 타입이 동일해야 함
      if (parent.getType() != type) {
        throw new BusinessException(ErrorCode.INVALID_PARENT_CATEGORY);
      }
    }

    Category category =
        Category.create(
            type,
            request.parentId(),
            request.name(),
            request.description(),
            request.iconId(),
            request.sortOrder());

    Category saved = categoryRepository.save(category);
    return CategoryResponse.from(saved);
  }

  /**
   * 카테고리를 조회한다.
   *
   * @param categoryId 카테고리 ID
   * @return 카테고리 응답
   */
  public CategoryResponse getCategory(Long categoryId) {
    Category category = findCategoryOrThrow(categoryId);
    return CategoryResponse.from(category);
  }

  /**
   * 타입별 카테고리 목록을 조회한다.
   *
   * @param type 카테고리 타입
   * @param activeOnly 활성화된 카테고리만 조회할지 여부
   * @return 카테고리 목록
   */
  public List<CategoryResponse> getCategoriesByType(CategoryType type, boolean activeOnly) {
    List<Category> categories;
    if (activeOnly) {
      categories = categoryRepository.findAllActiveByTypeOrderBySortOrder(type);
    } else {
      categories = categoryRepository.findAllByTypeOrderBySortOrder(type);
    }
    return categories.stream().map(CategoryResponse::from).toList();
  }

  /**
   * 타입별 최상위 카테고리 목록을 조회한다 (계층 구조).
   *
   * @param type 카테고리 타입
   * @param activeOnly 활성화된 카테고리만 조회할지 여부
   * @return 최상위 카테고리 목록 (하위 카테고리 포함)
   */
  public List<CategoryResponse> getRootCategoriesWithChildren(
      CategoryType type, boolean activeOnly) {
    List<Category> rootCategories;
    if (activeOnly) {
      rootCategories = categoryRepository.findAllActiveRootCategoriesByType(type);
    } else {
      rootCategories = categoryRepository.findAllRootCategoriesByType(type);
    }

    return rootCategories.stream().map(root -> buildCategoryTree(root, activeOnly)).toList();
  }

  /**
   * 카테고리를 수정한다.
   *
   * @param categoryId 카테고리 ID
   * @param request 수정 요청
   * @return 수정된 카테고리 응답
   */
  @Transactional
  public CategoryResponse updateCategory(Long categoryId, CategoryUpdateRequest request) {
    Category category = findCategoryOrThrow(categoryId);

    // 상위 카테고리 변경 시 검증
    if (request.parentId() != null) {
      validateParentCategory(categoryId, request.parentId(), category.getType());
    }

    Category updated =
        category.update(
            request.name(),
            request.description(),
            request.iconId(),
            request.sortOrder(),
            request.active(),
            request.parentId());

    Category saved = categoryRepository.save(updated);
    return CategoryResponse.from(saved);
  }

  /**
   * 카테고리를 삭제한다.
   *
   * @param categoryId 카테고리 ID
   */
  @Transactional
  public void deleteCategory(Long categoryId) {
    if (!categoryRepository.existsById(categoryId)) {
      throw new EntityNotFoundException(ErrorCode.CATEGORY_NOT_FOUND);
    }
    categoryRepository.deleteById(categoryId);
  }

  /**
   * 카테고리를 비활성화한다.
   *
   * @param categoryId 카테고리 ID
   * @return 비활성화된 카테고리 응답
   */
  @Transactional
  public CategoryResponse deactivateCategory(Long categoryId) {
    Category category = findCategoryOrThrow(categoryId);
    Category deactivated = category.deactivate();
    Category saved = categoryRepository.save(deactivated);
    return CategoryResponse.from(saved);
  }

  private Category findCategoryOrThrow(Long categoryId) {
    return categoryRepository
        .findById(categoryId)
        .orElseThrow(() -> new EntityNotFoundException(ErrorCode.CATEGORY_NOT_FOUND));
  }

  private void validateParentCategory(Long categoryId, Long parentId, CategoryType type) {
    // 자기 자신을 부모로 설정 불가
    if (categoryId.equals(parentId)) {
      throw new BusinessException(ErrorCode.CIRCULAR_CATEGORY_REFERENCE);
    }

    Category parent =
        categoryRepository
            .findById(parentId)
            .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_PARENT_CATEGORY));

    // 타입이 동일해야 함
    if (parent.getType() != type) {
      throw new BusinessException(ErrorCode.INVALID_PARENT_CATEGORY);
    }

    // 순환 참조 체크 (부모의 부모가 현재 카테고리인지 확인)
    Long currentParentId = parent.getParentId();
    while (currentParentId != null) {
      if (currentParentId.equals(categoryId)) {
        throw new BusinessException(ErrorCode.CIRCULAR_CATEGORY_REFERENCE);
      }
      Category currentParent = categoryRepository.findById(currentParentId).orElse(null);
      currentParentId = currentParent != null ? currentParent.getParentId() : null;
    }
  }

  private CategoryResponse buildCategoryTree(Category category, boolean activeOnly) {
    List<Category> children = categoryRepository.findAllByParentId(category.getId());

    if (activeOnly) {
      children = children.stream().filter(Category::isActive).toList();
    }

    List<CategoryResponse> childResponses =
        children.stream().map(child -> buildCategoryTree(child, activeOnly)).toList();

    return CategoryResponse.fromWithChildren(category, childResponses);
  }
}
