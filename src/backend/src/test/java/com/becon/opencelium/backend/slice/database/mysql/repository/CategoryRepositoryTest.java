/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.slice.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.Category;
import com.becon.opencelium.backend.database.mysql.repository.CategoryRepository;
import com.becon.opencelium.backend.testutil.annotation.SliceTest;
import com.becon.opencelium.backend.testutil.fixture.CategoryFixture;
import org.hibernate.Hibernate;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * JPA slice test for {@link CategoryRepository} — validates derived-query
 * resolution and entity mapping against the H2 schema.
 *
 * A unit test cannot catch:
 *   · a typo or schema drift in {@code existsByNameEqualsIgnoreCase} — Spring
 *     Data only validates derived-query names at runtime, and case-insensitive
 *     comparison requires a real SQL engine to translate {@code LOWER(name)};
 *   · regression of {@code @ManyToOne}/{@code @OneToMany} fetch type from
 *     EAGER to LAZY — only Hibernate fires the join at find-time.
 *
 * Run with: ./gradlew test --tests "*.CategoryRepositoryTest"
 */
@SliceTest
@DisplayName("CategoryRepository — JPA slice")
class CategoryRepositoryTest {

    @Autowired
    private TestEntityManager em;

    @Autowired
    private CategoryRepository categoryRepository;

    // ── existsByNameEqualsIgnoreCase ──────────────────────────────────────────

    @Test
    void existsByNameEqualsIgnoreCaseReturnsTrueWhenSameCase() {
        em.persistAndFlush(CategoryFixture.aTransientCategory("Sales"));
        em.clear();

        boolean result = categoryRepository.existsByNameEqualsIgnoreCase("Sales");

        assertThat(result).isTrue();
    }

    @Test
    void existsByNameEqualsIgnoreCaseReturnsTrueWhenDifferentCase() {
        em.persistAndFlush(CategoryFixture.aTransientCategory("Sales"));
        em.clear();

        // Mutation-resistant: a regression that drops {@code IgnoreCase} from
        // the finder name would resolve this to false and fail the test.
        boolean result = categoryRepository.existsByNameEqualsIgnoreCase("SALES");

        assertThat(result).isTrue();
    }

    @Test
    void existsByNameEqualsIgnoreCaseReturnsTrueWhenMixedCase() {
        em.persistAndFlush(CategoryFixture.aTransientCategory("Sales"));
        em.clear();

        boolean result = categoryRepository.existsByNameEqualsIgnoreCase("sAlEs");

        assertThat(result).isTrue();
    }

    @Test
    void existsByNameEqualsIgnoreCaseReturnsFalseWhenNameNotPersisted() {
        em.persistAndFlush(CategoryFixture.aTransientCategory("Sales"));
        em.clear();

        boolean result = categoryRepository.existsByNameEqualsIgnoreCase("Marketing");

        assertThat(result).isFalse();
    }

    @Test
    void existsByNameEqualsIgnoreCaseReturnsFalseWhenTableIsEmpty() {
        boolean result = categoryRepository.existsByNameEqualsIgnoreCase("anything");

        assertThat(result).isFalse();
    }

    // ── entity mapping — self-referential tree ────────────────────────────────

    @Test
    void findByIdLoadsParentAndSubCategoriesEagerly() {
        Category parent = CategoryFixture.aTransientCategory("Region");
        em.persist(parent);

        Category child = CategoryFixture.aTransientCategory("Sales");
        child.setParentCategory(parent);
        em.persist(child);

        em.flush();
        Integer parentId = parent.getId();
        Integer childId = child.getId();
        em.clear();

        Optional<Category> reloadedParent = categoryRepository.findById(parentId);
        Optional<Category> reloadedChild = categoryRepository.findById(childId);

        assertThat(reloadedParent).isPresent();
        assertThat(reloadedChild).isPresent();
        // Both associations must be initialized at find-time — flipping the
        // entity's @ManyToOne or @OneToMany to LAZY would leave these as
        // uninitialized proxies and fail the test.
        assertThat(Hibernate.isInitialized(reloadedParent.get().getSubCategories())).isTrue();
        assertThat(Hibernate.isInitialized(reloadedChild.get().getParentCategory())).isTrue();
        assertThat(reloadedParent.get().getSubCategories())
                .extracting(Category::getId)
                .containsExactly(childId);
        assertThat(reloadedChild.get().getParentCategory().getId()).isEqualTo(parentId);
    }

    @Test
    void findByIdLeavesSubCategoriesEmptyWhenLeaf() {
        Category leaf = CategoryFixture.aTransientCategory("Leaf");
        em.persistAndFlush(leaf);
        Integer id = leaf.getId();
        em.clear();

        Optional<Category> result = categoryRepository.findById(id);

        assertThat(result).isPresent();
        assertThat(result.get().getSubCategories()).isEmpty();
        assertThat(result.get().getParentCategory()).isNull();
    }

    // ── deleteById ────────────────────────────────────────────────────────────

    @Test
    void deleteByIdRemovesRowFromCategoryTable() {
        Category category = CategoryFixture.aTransientCategory("Doomed");
        em.persistAndFlush(category);
        Integer id = category.getId();

        categoryRepository.deleteById(id);
        em.flush();
        em.clear();

        assertThat(categoryRepository.findById(id)).isEmpty();
    }
}
