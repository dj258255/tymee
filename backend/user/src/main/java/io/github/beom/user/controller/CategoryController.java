package io.github.beom.user.controller;

import io.github.beom.core.web.ApiResponse;
import io.github.beom.user.domain.vo.CategoryType;
import io.github.beom.user.dto.CategoryCreateRequest;
import io.github.beom.user.dto.CategoryResponse;
import io.github.beom.user.dto.CategoryUpdateRequest;
import io.github.beom.user.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** 카테고리 API 컨트롤러. */
@Tag(name = "Category", description = "카테고리 관리 API")
@RestController
@RequestMapping(path = "/categories", version = "1.0")
@RequiredArgsConstructor
public class CategoryController {

  private final CategoryService categoryService;

  /** POST /categories - 카테고리 생성 (관리자 전용) */
  @Operation(summary = "카테고리 생성", description = "새로운 카테고리를 생성합니다. 관리자 권한이 필요합니다.")
  @PostMapping
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<CategoryResponse> createCategory(
      @Valid @RequestBody CategoryCreateRequest request) {
    CategoryResponse response = categoryService.createCategory(request);
    return ApiResponse.success(response);
  }

  /** GET /categories/{categoryId} - 카테고리 단건 조회 */
  @Operation(summary = "카테고리 조회", description = "카테고리를 조회합니다.")
  @GetMapping("/{categoryId}")
  public ApiResponse<CategoryResponse> getCategory(@PathVariable Long categoryId) {
    CategoryResponse response = categoryService.getCategory(categoryId);
    return ApiResponse.success(response);
  }

  /** GET /categories?type=SUBJECT - 타입별 카테고리 목록 조회 */
  @Operation(summary = "타입별 카테고리 목록 조회", description = "특정 타입의 카테고리 목록을 조회합니다.")
  @GetMapping
  public ApiResponse<List<CategoryResponse>> getCategoriesByType(
      @RequestParam String type, @RequestParam(defaultValue = "true") boolean activeOnly) {
    CategoryType categoryType = CategoryType.valueOf(type.toUpperCase());
    List<CategoryResponse> responses =
        categoryService.getCategoriesByType(categoryType, activeOnly);
    return ApiResponse.success(responses);
  }

  /** GET /categories/tree?type=SUBJECT - 타입별 카테고리 계층 구조 조회 */
  @Operation(summary = "카테고리 계층 구조 조회", description = "특정 타입의 카테고리를 계층 구조로 조회합니다.")
  @GetMapping("/tree")
  public ApiResponse<List<CategoryResponse>> getCategoryTree(
      @RequestParam String type, @RequestParam(defaultValue = "true") boolean activeOnly) {
    CategoryType categoryType = CategoryType.valueOf(type.toUpperCase());
    List<CategoryResponse> responses =
        categoryService.getRootCategoriesWithChildren(categoryType, activeOnly);
    return ApiResponse.success(responses);
  }

  /** PATCH /categories/{categoryId} - 카테고리 수정 (관리자 전용) */
  @Operation(summary = "카테고리 수정", description = "카테고리 정보를 수정합니다. 관리자 권한이 필요합니다.")
  @PatchMapping("/{categoryId}")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<CategoryResponse> updateCategory(
      @PathVariable Long categoryId, @Valid @RequestBody CategoryUpdateRequest request) {
    CategoryResponse response = categoryService.updateCategory(categoryId, request);
    return ApiResponse.success(response);
  }

  /** POST /categories/{categoryId}/deactivate - 카테고리 비활성화 (관리자 전용) */
  @Operation(summary = "카테고리 비활성화", description = "카테고리를 비활성화합니다. 관리자 권한이 필요합니다.")
  @PostMapping("/{categoryId}/deactivate")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<CategoryResponse> deactivateCategory(@PathVariable Long categoryId) {
    CategoryResponse response = categoryService.deactivateCategory(categoryId);
    return ApiResponse.success(response);
  }

  /** DELETE /categories/{categoryId} - 카테고리 삭제 (관리자 전용) */
  @Operation(summary = "카테고리 삭제", description = "카테고리를 삭제합니다. 관리자 권한이 필요합니다.")
  @DeleteMapping("/{categoryId}")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<Void> deleteCategory(@PathVariable Long categoryId) {
    categoryService.deleteCategory(categoryId);
    return ApiResponse.success(null);
  }
}
