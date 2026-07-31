/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.mapper.mysql;

import com.becon.opencelium.backend.database.mysql.entity.Category;
import com.becon.opencelium.backend.mapper.mysql.CategoryResponseMapperImpl;
import com.becon.opencelium.backend.mapper.utils.HelperMapperImpl;
import com.becon.opencelium.backend.resource.CategoryResponseDTO;
import com.becon.opencelium.backend.testutil.fixture.CategoryFixture;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for {@link com.becon.opencelium.backend.mapper.mysql.CategoryResponseMapper}.
 *
 * Runs the MapStruct-generated {@code CategoryResponseMapperImpl} directly,
 * wired to a real {@link HelperMapperImpl} via {@link ReflectionTestUtils}.
 * The two Helper methods we exercise ({@code mapParentCategory},
 * {@code mapCategoriesToIds}) don't touch any of HelperMapper's @Autowired
 * collaborators, so those fields are intentionally left null.
 *
 * The parent is mapped shallowly — only id and name carry over, never the
 * grandparent or sub-categories — which is the contract callers depend on
 * to avoid recursive serialization. Several tests pin that behavior.
 *
 * Run with: ./gradlew test --tests "*.CategoryResponseMapperTest"
 */
class CategoryResponseMapperTest {

    private CategoryResponseMapperImpl mapper;

    @BeforeEach
    void setUp() {
        mapper = new CategoryResponseMapperImpl();
        ReflectionTestUtils.setField(mapper, "helperMapper", new HelperMapperImpl());
    }

    // ── toDTO — happy paths ───────────────────────────────────────────────────

    @Test
    void toDtoMapsIdAndNameWhenEntityIsFlat() {
        Category entity = CategoryFixture.aCategoryWithId(1, "Sales");

        CategoryResponseDTO dto = mapper.toDTO(entity);

        assertThat(dto.getId()).isEqualTo(1);
        assertThat(dto.getName()).isEqualTo("Sales");
    }

    @Test
    void toDtoMapsParentToShallowDtoWhenEntityHasParent() {
        Category grandparent = CategoryFixture.aCategoryWithId(99, "Grand");
        Category parent = CategoryFixture.aCategoryWithId(5, "Region");
        parent.setParentCategory(grandparent);
        // Give the parent its own sub-categories — they must NOT leak into
        // the response, or recursive trees would blow up serialization.
        parent.getSubCategories().add(CategoryFixture.aCategoryWithId(77, "Sibling"));
        Category entity = CategoryFixture.aCategoryWithId(1, "Sales");
        entity.setParentCategory(parent);

        CategoryResponseDTO dto = mapper.toDTO(entity);

        assertThat(dto.getParentCategory()).isNotNull();
        assertThat(dto.getParentCategory().getId()).isEqualTo(5);
        assertThat(dto.getParentCategory().getName()).isEqualTo("Region");
        // Mutation-resistant: if HelperMapper.mapParentCategory ever started
        // recursing, these would no longer be null.
        assertThat(dto.getParentCategory().getParentCategory()).isNull();
        assertThat(dto.getParentCategory().getSubCategories()).isNull();
    }

    @Test
    void toDtoMapsParentToNullWhenEntityHasNoParent() {
        Category entity = CategoryFixture.aCategoryWithId(1, "Sales");

        CategoryResponseDTO dto = mapper.toDTO(entity);

        assertThat(dto.getParentCategory()).isNull();
    }

    @Test
    void toDtoMapsSubCategoriesToIdSetWhenEntityHasChildren() {
        Category entity = CategoryFixture.aCategoryWithSubCategories(1, "Sales", 7, 8, 9);

        CategoryResponseDTO dto = mapper.toDTO(entity);

        assertThat(dto.getSubCategories()).containsExactlyInAnyOrder(7, 8, 9);
    }

    @Test
    void toDtoMapsSubCategoriesToNullWhenEntitySetIsNull() {
        Category entity = CategoryFixture.aCategoryWithId(1, "Sales");
        entity.setSubCategories(null);

        CategoryResponseDTO dto = mapper.toDTO(entity);

        // Distinguishing null vs empty matters — CategoryResponseDTO is
        // annotated @JsonInclude(NON_NULL) so a null set is omitted from
        // the JSON entirely, whereas an empty set would serialize as [].
        assertThat(dto.getSubCategories()).isNull();
    }

    @Test
    void toDtoMapsSubCategoriesToEmptySetWhenEntitySetIsEmpty() {
        Category entity = CategoryFixture.aCategoryWithId(1, "Sales");
        entity.setSubCategories(new HashSet<>());

        CategoryResponseDTO dto = mapper.toDTO(entity);

        assertThat(dto.getSubCategories()).isNotNull().isEmpty();
    }

    // ── toDTO — null input ────────────────────────────────────────────────────

    @Test
    void toDtoReturnsNullWhenEntityIsNull() {
        CategoryResponseDTO dto = mapper.toDTO(null);

        assertThat(dto).isNull();
    }

    // ── toEntity — explicit no-op contract ────────────────────────────────────

    @Test
    void toEntityReturnsNullWhenCalled() {
        // The interface deliberately overrides toEntity to return null —
        // categories never need DTO → entity mapping in this codebase.
        Category result = mapper.toEntity(CategoryFixture.aResponseDto(1, "Sales"));

        assertThat(result).isNull();
    }

    // ── toDTOAll — default method on Mapper ───────────────────────────────────

    @Test
    void toDtoAllPreservesOrderWhenInputHasMultipleEntities() {
        Category a = CategoryFixture.aCategoryWithId(1, "A");
        Category b = CategoryFixture.aCategoryWithId(2, "B");

        List<CategoryResponseDTO> result = mapper.toDTOAll(List.of(a, b));

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getId()).isEqualTo(1);
        assertThat(result.get(0).getName()).isEqualTo("A");
        assertThat(result.get(1).getId()).isEqualTo(2);
        assertThat(result.get(1).getName()).isEqualTo("B");
    }

    @Test
    void toDtoAllReturnsNullWhenInputIsNull() {
        List<CategoryResponseDTO> result = mapper.toDTOAll(null);

        assertThat(result).isNull();
    }

    @Test
    void toDtoAllReturnsEmptyListWhenInputIsEmpty() {
        List<CategoryResponseDTO> result = mapper.toDTOAll(List.of());

        assertThat(result).isEmpty();
    }

    // ── HelperMapper contract — pinned through the mapper ─────────────────────

    @Test
    void mapCategoriesToIdsReturnsIdsOnlyWhenCalled() {
        // Confirms via the mapper that the helper extracts ids and discards
        // every other field — names, parents, nested subs are not exposed.
        Category entity = CategoryFixture.aCategoryWithId(1, "Sales");
        Set<Category> subs = new HashSet<>();
        Category sub = CategoryFixture.aCategoryWithId(42, "WithGuts");
        sub.setParentCategory(CategoryFixture.aCategoryWithId(99, "ShouldNotLeak"));
        sub.getSubCategories().add(CategoryFixture.aCategoryWithId(77, "AlsoShouldNotLeak"));
        subs.add(sub);
        entity.setSubCategories(subs);

        CategoryResponseDTO dto = mapper.toDTO(entity);

        assertThat(dto.getSubCategories()).containsExactly(42);
    }
}
