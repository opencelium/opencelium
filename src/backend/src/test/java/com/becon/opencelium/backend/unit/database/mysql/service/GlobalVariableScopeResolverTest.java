package com.becon.opencelium.backend.unit.database.mysql.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertTimeoutPreemptively;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.becon.opencelium.backend.database.mysql.entity.Category;
import com.becon.opencelium.backend.database.mysql.repository.CategoryRepository;
import com.becon.opencelium.backend.database.mysql.service.GlobalVariableScopeResolver;
import com.becon.opencelium.backend.testutil.fixture.CategoryFixture;
import java.time.Duration;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Unit tests for {@link GlobalVariableScopeResolver}: the categories a workflow is matched with.
 *
 * <p>Run with: ./gradlew test --tests "*.GlobalVariableScopeResolverTest"
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("GlobalVariableScopeResolver — unit")
class GlobalVariableScopeResolverTest {

    @Mock
    CategoryRepository categoryRepository;

    @InjectMocks
    GlobalVariableScopeResolver resolver;

    @Test
    @DisplayName("chain — the category itself and every category above it")
    void categoryChainOfReturnsParentsWhenCategoryIsNested() {
        Category root = aCategory(1, null);
        Category middle = aCategory(3, root);
        when(categoryRepository.findById(5)).thenReturn(Optional.of(aCategory(5, middle)));

        Set<Long> chain = resolver.categoryChainOf(5);

        assertThat(chain).containsExactlyInAnyOrder(5L, 3L, 1L);
    }

    @Test
    void categoryChainOfReturnsOnlyCategoryWhenItHasNoParent() {
        when(categoryRepository.findById(5)).thenReturn(Optional.of(aCategory(5, null)));

        Set<Long> chain = resolver.categoryChainOf(5);

        assertThat(chain).containsExactly(5L);
    }

    @Test
    void categoryChainOfReturnsEmptyWhenCategoryIsNull() {
        Set<Long> chain = resolver.categoryChainOf(null);

        assertThat(chain).isEmpty();
        verifyNoInteractions(categoryRepository);
    }

    @Test
    void categoryChainOfReturnsEmptyWhenCategoryDoesNotExist() {
        when(categoryRepository.findById(5)).thenReturn(Optional.empty());

        Set<Long> chain = resolver.categoryChainOf(5);

        assertThat(chain).isEmpty();
    }

    @Test
    @DisplayName("chain — categories that are each other's parent do not hang the caller")
    void categoryChainOfStopsWhenParentsFormCycle() {
        Category first = aCategory(5, null);
        Category second = aCategory(3, first);
        first.setParentCategory(second);
        when(categoryRepository.findById(5)).thenReturn(Optional.of(first));

        Set<Long> chain = assertTimeoutPreemptively(Duration.ofSeconds(5), () -> resolver.categoryChainOf(5));

        assertThat(chain).containsExactlyInAnyOrder(5L, 3L);
    }

    private static Category aCategory(int id, Category parent) {
        Category category = CategoryFixture.aCategoryWithId(id, "category-" + id);
        category.setParentCategory(parent);
        return category;
    }
}
