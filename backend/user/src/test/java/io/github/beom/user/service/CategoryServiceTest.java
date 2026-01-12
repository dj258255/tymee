package io.github.beom.user.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import io.github.beom.core.exception.BusinessException;
import io.github.beom.core.exception.EntityNotFoundException;
import io.github.beom.user.domain.Category;
import io.github.beom.user.domain.vo.CategoryType;
import io.github.beom.user.dto.CategoryCreateRequest;
import io.github.beom.user.dto.CategoryResponse;
import io.github.beom.user.dto.CategoryUpdateRequest;
import io.github.beom.user.repository.CategoryRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("CategoryService 테스트")
class CategoryServiceTest {

  @Mock private CategoryRepository categoryRepository;

  @InjectMocks private CategoryService categoryService;

  @Nested
  @DisplayName("카테고리 생성")
  class CreateCategory {

    @Test
    @DisplayName("성공: 최상위 카테고리 생성")
    void createRootCategorySuccess() {
      // given
      var request = new CategoryCreateRequest("SUBJECT", null, "수학", "수학 관련 과목", null, 1);

      Category savedCategory =
          Category.builder()
              .id(1L)
              .type(CategoryType.SUBJECT)
              .parentId(null)
              .name("수학")
              .description("수학 관련 과목")
              .sortOrder(1)
              .active(true)
              .build();

      given(categoryRepository.existsByTypeAndName(CategoryType.SUBJECT, "수학")).willReturn(false);
      given(categoryRepository.save(any(Category.class))).willReturn(savedCategory);

      // when
      CategoryResponse response = categoryService.createCategory(request);

      // then
      assertThat(response.id()).isEqualTo(1L);
      assertThat(response.type()).isEqualTo("SUBJECT");
      assertThat(response.name()).isEqualTo("수학");
      assertThat(response.parentId()).isNull();
    }

    @Test
    @DisplayName("성공: 하위 카테고리 생성")
    void createChildCategorySuccess() {
      // given
      var request = new CategoryCreateRequest("SUBJECT", 1L, "미적분", "미적분 과목", null, 1);

      Category parentCategory =
          Category.builder().id(1L).type(CategoryType.SUBJECT).name("수학").active(true).build();

      Category savedCategory =
          Category.builder()
              .id(2L)
              .type(CategoryType.SUBJECT)
              .parentId(1L)
              .name("미적분")
              .sortOrder(1)
              .active(true)
              .build();

      given(categoryRepository.existsByTypeAndName(CategoryType.SUBJECT, "미적분")).willReturn(false);
      given(categoryRepository.findById(1L)).willReturn(Optional.of(parentCategory));
      given(categoryRepository.save(any(Category.class))).willReturn(savedCategory);

      // when
      CategoryResponse response = categoryService.createCategory(request);

      // then
      assertThat(response.id()).isEqualTo(2L);
      assertThat(response.parentId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("실패: 중복된 카테고리명")
    void createCategoryDuplicateName() {
      // given
      var request = new CategoryCreateRequest("SUBJECT", null, "수학", null, null, null);

      given(categoryRepository.existsByTypeAndName(CategoryType.SUBJECT, "수학")).willReturn(true);

      // when & then
      assertThatThrownBy(() -> categoryService.createCategory(request))
          .isInstanceOf(BusinessException.class)
          .hasMessageContaining("이미 존재하는 카테고리명");
    }

    @Test
    @DisplayName("실패: 존재하지 않는 상위 카테고리")
    void createCategoryInvalidParent() {
      // given
      var request = new CategoryCreateRequest("SUBJECT", 999L, "미적분", null, null, null);

      given(categoryRepository.existsByTypeAndName(CategoryType.SUBJECT, "미적분")).willReturn(false);
      given(categoryRepository.findById(999L)).willReturn(Optional.empty());

      // when & then
      assertThatThrownBy(() -> categoryService.createCategory(request))
          .isInstanceOf(BusinessException.class)
          .hasMessageContaining("유효하지 않은 상위 카테고리");
    }

    @Test
    @DisplayName("실패: 상위 카테고리 타입 불일치")
    void createCategoryTypeMismatch() {
      // given
      var request = new CategoryCreateRequest("SUBJECT", 1L, "미적분", null, null, null);

      Category parentCategory =
          Category.builder().id(1L).type(CategoryType.GROUP).name("스터디").active(true).build();

      given(categoryRepository.existsByTypeAndName(CategoryType.SUBJECT, "미적분")).willReturn(false);
      given(categoryRepository.findById(1L)).willReturn(Optional.of(parentCategory));

      // when & then
      assertThatThrownBy(() -> categoryService.createCategory(request))
          .isInstanceOf(BusinessException.class)
          .hasMessageContaining("유효하지 않은 상위 카테고리");
    }
  }

  @Nested
  @DisplayName("카테고리 조회")
  class GetCategory {

    @Test
    @DisplayName("성공: 카테고리 단건 조회")
    void getCategorySuccess() {
      // given
      Long categoryId = 1L;
      Category category =
          Category.builder()
              .id(categoryId)
              .type(CategoryType.SUBJECT)
              .name("수학")
              .active(true)
              .build();

      given(categoryRepository.findById(categoryId)).willReturn(Optional.of(category));

      // when
      CategoryResponse response = categoryService.getCategory(categoryId);

      // then
      assertThat(response.id()).isEqualTo(categoryId);
      assertThat(response.name()).isEqualTo("수학");
    }

    @Test
    @DisplayName("실패: 존재하지 않는 카테고리")
    void getCategoryNotFound() {
      // given
      Long categoryId = 999L;
      given(categoryRepository.findById(categoryId)).willReturn(Optional.empty());

      // when & then
      assertThatThrownBy(() -> categoryService.getCategory(categoryId))
          .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    @DisplayName("성공: 타입별 카테고리 목록 조회")
    void getCategoriesByTypeSuccess() {
      // given
      List<Category> categories =
          List.of(
              Category.builder()
                  .id(1L)
                  .type(CategoryType.SUBJECT)
                  .name("수학")
                  .sortOrder(1)
                  .active(true)
                  .build(),
              Category.builder()
                  .id(2L)
                  .type(CategoryType.SUBJECT)
                  .name("영어")
                  .sortOrder(2)
                  .active(true)
                  .build());

      given(categoryRepository.findAllActiveByTypeOrderBySortOrder(CategoryType.SUBJECT))
          .willReturn(categories);

      // when
      List<CategoryResponse> responses =
          categoryService.getCategoriesByType(CategoryType.SUBJECT, true);

      // then
      assertThat(responses).hasSize(2);
      assertThat(responses.get(0).name()).isEqualTo("수학");
      assertThat(responses.get(1).name()).isEqualTo("영어");
    }
  }

  @Nested
  @DisplayName("카테고리 수정")
  class UpdateCategory {

    @Test
    @DisplayName("성공: 카테고리 수정")
    void updateCategorySuccess() {
      // given
      Long categoryId = 1L;
      Category existingCategory =
          Category.builder()
              .id(categoryId)
              .type(CategoryType.SUBJECT)
              .name("수학")
              .description("기존 설명")
              .sortOrder(1)
              .active(true)
              .build();

      var request = new CategoryUpdateRequest(null, "Mathematics", "수정된 설명", null, 2, null);

      given(categoryRepository.findById(categoryId)).willReturn(Optional.of(existingCategory));
      given(categoryRepository.save(any(Category.class))).willAnswer(inv -> inv.getArgument(0));

      // when
      CategoryResponse response = categoryService.updateCategory(categoryId, request);

      // then
      assertThat(response.name()).isEqualTo("Mathematics");
      assertThat(response.description()).isEqualTo("수정된 설명");
      assertThat(response.sortOrder()).isEqualTo(2);
    }
  }

  @Nested
  @DisplayName("카테고리 삭제")
  class DeleteCategory {

    @Test
    @DisplayName("성공: 카테고리 삭제")
    void deleteCategorySuccess() {
      // given
      Long categoryId = 1L;
      given(categoryRepository.existsById(categoryId)).willReturn(true);

      // when
      categoryService.deleteCategory(categoryId);

      // then
      verify(categoryRepository).deleteById(categoryId);
    }

    @Test
    @DisplayName("실패: 존재하지 않는 카테고리 삭제")
    void deleteCategoryNotFound() {
      // given
      Long categoryId = 999L;
      given(categoryRepository.existsById(categoryId)).willReturn(false);

      // when & then
      assertThatThrownBy(() -> categoryService.deleteCategory(categoryId))
          .isInstanceOf(EntityNotFoundException.class);
    }
  }

  @Nested
  @DisplayName("카테고리 비활성화")
  class DeactivateCategory {

    @Test
    @DisplayName("성공: 카테고리 비활성화")
    void deactivateCategorySuccess() {
      // given
      Long categoryId = 1L;
      Category existingCategory =
          Category.builder()
              .id(categoryId)
              .type(CategoryType.SUBJECT)
              .name("수학")
              .active(true)
              .build();

      given(categoryRepository.findById(categoryId)).willReturn(Optional.of(existingCategory));
      given(categoryRepository.save(any(Category.class))).willAnswer(inv -> inv.getArgument(0));

      // when
      CategoryResponse response = categoryService.deactivateCategory(categoryId);

      // then
      assertThat(response.active()).isFalse();
    }
  }
}
