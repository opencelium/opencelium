/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.testutil.fixture;

import com.becon.opencelium.backend.database.mysql.entity.Category;
import com.becon.opencelium.backend.resource.CategoryDTO;
import com.becon.opencelium.backend.resource.CategoryResponseDTO;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Object mother for {@link Category}, {@link CategoryDTO} and
 * {@link CategoryResponseDTO} test data.
 *
 * Use the named factory methods in test classes — never construct
 * Category, CategoryDTO or CategoryResponseDTO inline. Add new named
 * scenarios here instead of duplicating setup across test classes.
 */
public final class CategoryFixture {

    private CategoryFixture() {}

    // ── Entity factories ──────────────────────────────────────────────────────

    /**
     * Transient category without an id, suitable for {@code @DataJpaTest}
     * {@code persistAndFlush} where the database assigns the id.
     */
    public static Category aTransientCategory(String name) {
        Category category = new Category();
        category.setName(name);
        return category;
    }

    /**
     * Category with the supplied id and name, no parent, no sub-categories.
     * Use as the default starting point for service-unit tests where the
     * id has to be deterministic.
     */
    public static Category aCategoryWithId(Integer id, String name) {
        Category category = new Category(id);
        category.setName(name);
        category.setSubCategories(new HashSet<>());
        return category;
    }

    /**
     * Standard root-level category — id=1, name="Root".
     */
    public static Category aRootCategory() {
        return aCategoryWithId(1, "Root");
    }

    /**
     * Child category — id=2, name="Child" — with the supplied parent wired
     * on both sides of the relationship.
     */
    public static Category aChildOf(Category parent) {
        Category child = aCategoryWithId(2, "Child");
        child.setParentCategory(parent);
        parent.getSubCategories().add(child);
        return child;
    }

    /**
     * Builds a parent category with the supplied child ids attached.
     * Each child is created via {@link #aCategoryWithId(Integer, String)}
     * (name = "Child-{id}") and back-wired to the parent.
     */
    public static Category aCategoryWithSubCategories(Integer parentId, String parentName, Integer... childIds) {
        Category parent = aCategoryWithId(parentId, parentName);
        Set<Category> subs = Arrays.stream(childIds)
                .map(id -> {
                    Category child = aCategoryWithId(id, "Child-" + id);
                    child.setParentCategory(parent);
                    return child;
                })
                .collect(Collectors.toCollection(HashSet::new));
        parent.setSubCategories(subs);
        return parent;
    }

    /**
     * Three-level chain — grandparent → parent → child — useful for cascade
     * and cycle tests where the depth matters.
     * Returns the grandparent (root of the chain).
     */
    public static Category aThreeLevelChain() {
        Category grandparent = aCategoryWithId(10, "Grandparent");
        Category parent = aCategoryWithId(11, "Parent");
        Category child = aCategoryWithId(12, "Child");

        parent.setParentCategory(grandparent);
        child.setParentCategory(parent);

        grandparent.getSubCategories().add(parent);
        parent.getSubCategories().add(child);

        return grandparent;
    }

    // ── CategoryDTO (request) factories ───────────────────────────────────────

    /**
     * Minimal create-request DTO carrying only a name.
     * Use as the happy-path input for {@code add}.
     */
    public static CategoryDTO aDtoWithName(String name) {
        CategoryDTO dto = new CategoryDTO();
        dto.setName(name);
        return dto;
    }

    /**
     * Update-request DTO with an id and name, no parent, no children.
     */
    public static CategoryDTO aDtoWithIdAndName(Integer id, String name) {
        CategoryDTO dto = new CategoryDTO();
        dto.setId(id);
        dto.setName(name);
        return dto;
    }

    /**
     * Create-request DTO with a parent id set.
     */
    public static CategoryDTO aDtoWithParent(String name, Integer parentId) {
        CategoryDTO dto = aDtoWithName(name);
        dto.setParentCategory(parentId);
        return dto;
    }

    /**
     * Create-request DTO with sub-category ids set.
     */
    public static CategoryDTO aDtoWithSubCategories(String name, Integer... subIds) {
        CategoryDTO dto = aDtoWithName(name);
        dto.setSubCategories(new HashSet<>(Arrays.asList(subIds)));
        return dto;
    }

    /**
     * Fully populated DTO — id, name, parent, sub-categories.
     * Use for update scenarios that exercise every branch at once.
     */
    public static CategoryDTO aFullDto(Integer id, String name, Integer parentId, Integer... subIds) {
        CategoryDTO dto = aDtoWithIdAndName(id, name);
        dto.setParentCategory(parentId);
        dto.setSubCategories(new HashSet<>(Arrays.asList(subIds)));
        return dto;
    }

    // ── CategoryResponseDTO factories ─────────────────────────────────────────

    /**
     * Response DTO matching {@link #aCategoryWithId(Integer, String)} — no
     * parent, no sub-categories.
     */
    public static CategoryResponseDTO aResponseDto(Integer id, String name) {
        CategoryResponseDTO dto = new CategoryResponseDTO();
        dto.setId(id);
        dto.setName(name);
        return dto;
    }
}
