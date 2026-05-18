/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.Category;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.repository.CategoryRepository;
import com.becon.opencelium.backend.database.mysql.service.CategoryServiceImp;
import com.becon.opencelium.backend.database.mysql.service.ConnectionService;
import com.becon.opencelium.backend.resource.CategoryDTO;
import com.becon.opencelium.backend.testutil.fixture.CategoryFixture;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link CategoryServiceImp}.
 *
 * Covers validation, parent/sub-category wiring, cycle detection,
 * cascade vs detach-only deletion, and bulk-delete error tolerance.
 *
 * Pure Mockito — every collaborator (CategoryRepository, ConnectionService)
 * is stubbed. Spring is not involved.
 */
@ExtendWith(MockitoExtension.class)
class CategoryServiceImpTest {

    @Mock
    CategoryRepository repository;

    @Mock
    ConnectionService connectionService;

    @InjectMocks
    CategoryServiceImp service;

    // ── add ───────────────────────────────────────────────────────────────────

    @Test
    void addThrowsWhenDtoIsNull() {
        assertThatThrownBy(() -> service.add(null))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("CATEGORY_IS_NULL");

        verifyNoInteractions(repository, connectionService);
    }

    @Test
    void addThrowsInvalidCategoryNameWhenNameIsNull() {
        CategoryDTO dto = CategoryFixture.aDtoWithName(null);

        assertThatThrownBy(() -> service.add(dto))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("INVALID_CATEGORY_NAME");

        verify(repository, never()).save(any());
    }

    @Test
    void addThrowsInvalidCategoryNameWhenNameIsBlank() {
        CategoryDTO dto = CategoryFixture.aDtoWithName("   ");

        assertThatThrownBy(() -> service.add(dto))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("INVALID_CATEGORY_NAME");

        verify(repository, never()).save(any());
    }

    @Test
    void addThrowsTitleAlreadyTakenWhenNameExists() {
        CategoryDTO dto = CategoryFixture.aDtoWithName("Sales");
        when(repository.existsByNameEqualsIgnoreCase("Sales")).thenReturn(true);

        assertThatThrownBy(() -> service.add(dto))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("TITLE_HAS_ALREADY_TAKEN");

        verify(repository, never()).save(any());
    }

    @Test
    void addThrowsParentCategoryNotFoundWhenParentDoesNotExist() {
        CategoryDTO dto = CategoryFixture.aDtoWithParent("Sales", 42);
        when(repository.existsByNameEqualsIgnoreCase("Sales")).thenReturn(false);
        when(repository.existsById(42)).thenReturn(false);

        assertThatThrownBy(() -> service.add(dto))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("PARENT_CATEGORY_NOT_FOUND");

        verify(repository, never()).save(any());
    }

    @Test
    void addThrowsSubCategoryNotFoundWithIdWhenAnySubMissing() {
        CategoryDTO dto = CategoryFixture.aDtoWithSubCategories("Sales", 7);

        when(repository.existsByNameEqualsIgnoreCase("Sales")).thenReturn(false);
        Category saved = CategoryFixture.aCategoryWithId(100, "Sales");
        when(repository.save(any(Category.class))).thenReturn(saved);
        when(repository.existsById(7)).thenReturn(false);

        assertThatThrownBy(() -> service.add(dto))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("SUB_CATEGORY_NOT_FOUND")
                .hasMessageContaining("7");
    }

    @Test
    void addPersistsRootCategoryAndReturnsIdWhenOnlyNameProvided() {
        CategoryDTO dto = CategoryFixture.aDtoWithName("Sales");

        when(repository.existsByNameEqualsIgnoreCase("Sales")).thenReturn(false);
        Category saved = CategoryFixture.aCategoryWithId(100, "Sales");
        when(repository.save(any(Category.class))).thenReturn(saved);

        Integer id = service.add(dto);

        assertThat(id).isEqualTo(100);

        ArgumentCaptor<Category> captor = ArgumentCaptor.forClass(Category.class);
        verify(repository).save(captor.capture());
        Category persisted = captor.getValue();
        assertThat(persisted.getName()).isEqualTo("Sales");
        assertThat(persisted.getParentCategory()).isNull();
    }

    @Test
    void addAttachesParentToSavedEntityWhenParentIdProvided() {
        CategoryDTO dto = CategoryFixture.aDtoWithParent("Sales", 5);

        when(repository.existsByNameEqualsIgnoreCase("Sales")).thenReturn(false);
        when(repository.existsById(5)).thenReturn(true);
        Category parent = CategoryFixture.aCategoryWithId(5, "Region");
        when(repository.findById(5)).thenReturn(Optional.of(parent));
        Category saved = CategoryFixture.aCategoryWithId(100, "Sales");
        saved.setParentCategory(parent);
        when(repository.save(any(Category.class))).thenReturn(saved);

        service.add(dto);

        ArgumentCaptor<Category> captor = ArgumentCaptor.forClass(Category.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getParentCategory()).isSameAs(parent);
    }

    @Test
    void addReparentsEachSubCategoryUnderNewlyCreatedCategoryWhenSubsProvided() {
        CategoryDTO dto = CategoryFixture.aDtoWithSubCategories("Sales", 7, 8);

        when(repository.existsByNameEqualsIgnoreCase("Sales")).thenReturn(false);

        Category saved = CategoryFixture.aCategoryWithId(100, "Sales");
        Category child7 = CategoryFixture.aCategoryWithId(7, "Child-7");
        Category child8 = CategoryFixture.aCategoryWithId(8, "Child-8");

        when(repository.save(any(Category.class)))
                .thenReturn(saved)   // 1st save: the new root
                .thenReturn(child7)  // subsequent saves: children — return values irrelevant
                .thenReturn(child8);
        when(repository.existsById(7)).thenReturn(true);
        when(repository.existsById(8)).thenReturn(true);
        when(repository.findById(7)).thenReturn(Optional.of(child7));
        when(repository.findById(8)).thenReturn(Optional.of(child8));

        service.add(dto);

        // Every child re-parented to the saved root.
        assertThat(child7.getParentCategory()).isSameAs(saved);
        assertThat(child8.getParentCategory()).isSameAs(saved);

        // 3 saves: root + 2 children.
        verify(repository, org.mockito.Mockito.times(3)).save(any(Category.class));
    }

    @Test
    void addThrowsCycleHasFoundWhenSavedEntityFormsParentLoopById() {
        CategoryDTO dto = CategoryFixture.aDtoWithParent("Sales", 2);

        when(repository.existsByNameEqualsIgnoreCase("Sales")).thenReturn(false);
        when(repository.existsById(2)).thenReturn(true);
        Category parent = CategoryFixture.aCategoryWithId(2, "Parent");
        when(repository.findById(2)).thenReturn(Optional.of(parent));

        // Hand-craft a saved entity whose ancestor chain loops back to its own id.
        Category saved = CategoryFixture.aCategoryWithId(100, "Sales");
        Category parentRef = CategoryFixture.aCategoryWithId(2, "ParentRef");
        Category backRef = CategoryFixture.aCategoryWithId(100, "SalesBackRef"); // same id as saved → cycle
        parentRef.setParentCategory(backRef);
        saved.setParentCategory(parentRef);
        when(repository.save(any(Category.class))).thenReturn(saved);

        assertThatThrownBy(() -> service.add(dto))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("CYCLE_HAS_FOUND");
    }

    // ── update ────────────────────────────────────────────────────────────────

    @Test
    void updateThrowsWhenDtoIsNull() {
        assertThatThrownBy(() -> service.update(null))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("CATEGORY_IS_NULL");

        verifyNoInteractions(repository, connectionService);
    }

    @Test
    void updateThrowsCategoryNotFoundWhenIdIsNull() {
        CategoryDTO dto = CategoryFixture.aDtoWithName("X");

        assertThatThrownBy(() -> service.update(dto))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("CATEGORY_NOT_FOUND");

        verify(repository, never()).save(any());
    }

    @Test
    void updateThrowsCategoryNotFoundWhenIdDoesNotExist() {
        CategoryDTO dto = CategoryFixture.aDtoWithIdAndName(99, "X");
        when(repository.existsById(99)).thenReturn(false);

        assertThatThrownBy(() -> service.update(dto))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("CATEGORY_NOT_FOUND");

        verify(repository, never()).save(any());
    }

    @Test
    void updateSkipsNameCheckWhenNameUnchanged() {
        Category old = CategoryFixture.aCategoryWithId(1, "Same");
        CategoryDTO dto = CategoryFixture.aDtoWithIdAndName(1, "Same");

        when(repository.existsById(1)).thenReturn(true);
        when(repository.findById(1)).thenReturn(Optional.of(old));
        Category saved = CategoryFixture.aCategoryWithId(1, "Same");
        when(repository.save(any(Category.class))).thenReturn(saved);

        service.update(dto);

        // Mutation-resistant: flipping Objects.equals(...) in the production
        // code would trigger this lookup and fail the test.
        verify(repository, never()).existsByNameEqualsIgnoreCase(any());
    }

    @Test
    void updateThrowsTitleAlreadyTakenWhenNewNameIsTaken() {
        Category old = CategoryFixture.aCategoryWithId(1, "Old");
        CategoryDTO dto = CategoryFixture.aDtoWithIdAndName(1, "New");

        when(repository.existsById(1)).thenReturn(true);
        when(repository.findById(1)).thenReturn(Optional.of(old));
        when(repository.existsByNameEqualsIgnoreCase("New")).thenReturn(true);

        assertThatThrownBy(() -> service.update(dto))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("TITLE_HAS_ALREADY_TAKEN");

        verify(repository, never()).save(any());
    }

    @Test
    void updateDetachesParentWhenDtoParentIsNullAndOldHadParent() {
        Category oldParent = CategoryFixture.aCategoryWithId(5, "Region");
        Category old = CategoryFixture.aCategoryWithId(1, "Sales");
        old.setParentCategory(oldParent);

        CategoryDTO dto = CategoryFixture.aDtoWithIdAndName(1, "Sales");

        when(repository.existsById(1)).thenReturn(true);
        when(repository.findById(1)).thenReturn(Optional.of(old));
        Category saved = CategoryFixture.aCategoryWithId(1, "Sales");
        when(repository.save(any(Category.class))).thenReturn(saved);

        service.update(dto);

        ArgumentCaptor<Category> captor = ArgumentCaptor.forClass(Category.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getParentCategory()).isNull();
    }

    @Test
    void updateAttachesNewParentWhenDtoParentDiffersFromOld() {
        Category oldParent = CategoryFixture.aCategoryWithId(5, "OldRegion");
        Category old = CategoryFixture.aCategoryWithId(1, "Sales");
        old.setParentCategory(oldParent);

        CategoryDTO dto = CategoryFixture.aDtoWithIdAndName(1, "Sales");
        dto.setParentCategory(7);

        when(repository.existsById(1)).thenReturn(true);
        when(repository.findById(1)).thenReturn(Optional.of(old));
        Category saved = CategoryFixture.aCategoryWithId(1, "Sales");
        when(repository.save(any(Category.class))).thenReturn(saved);

        service.update(dto);

        ArgumentCaptor<Category> captor = ArgumentCaptor.forClass(Category.class);
        verify(repository).save(captor.capture());
        Category persisted = captor.getValue();
        assertThat(persisted.getParentCategory()).isNotNull();
        assertThat(persisted.getParentCategory().getId()).isEqualTo(7);
    }

    @Test
    void updateKeepsParentReferenceWhenDtoParentEqualsOldParent() {
        Category oldParent = CategoryFixture.aCategoryWithId(5, "Region");
        Category old = CategoryFixture.aCategoryWithId(1, "Sales");
        old.setParentCategory(oldParent);

        CategoryDTO dto = CategoryFixture.aDtoWithIdAndName(1, "Sales");
        dto.setParentCategory(5);

        when(repository.existsById(1)).thenReturn(true);
        when(repository.findById(1)).thenReturn(Optional.of(old));
        Category saved = CategoryFixture.aCategoryWithId(1, "Sales");
        saved.setParentCategory(oldParent);
        when(repository.save(any(Category.class))).thenReturn(saved);

        service.update(dto);

        ArgumentCaptor<Category> captor = ArgumentCaptor.forClass(Category.class);
        verify(repository).save(captor.capture());
        // The same reference is preserved — the production code intentionally
        // skips reassignment when the parent id is unchanged.
        assertThat(captor.getValue().getParentCategory()).isSameAs(oldParent);
    }

    @Test
    void updateAttachesNewSubCategoriesNotPreviouslyAttached() {
        Category old = CategoryFixture.aCategoryWithSubCategories(1, "Sales", 7);
        Category child8 = CategoryFixture.aCategoryWithId(8, "Outsider");

        CategoryDTO dto = CategoryFixture.aDtoWithIdAndName(1, "Sales");
        dto.setSubCategories(new HashSet<>(Arrays.asList(7, 8))); // 7 already attached, 8 is new

        when(repository.existsById(1)).thenReturn(true);
        when(repository.existsById(7)).thenReturn(true);
        when(repository.existsById(8)).thenReturn(true);
        when(repository.findById(1)).thenReturn(Optional.of(old));
        when(repository.findById(8)).thenReturn(Optional.of(child8));
        Category saved = CategoryFixture.aCategoryWithId(1, "Sales");
        when(repository.save(any(Category.class))).thenReturn(saved);

        service.update(dto);

        // Newly-attached child gets its parent reset to old.
        assertThat(child8.getParentCategory()).isSameAs(old);

        // child 7 already belonged to old → it must not be re-saved.
        verify(repository, never()).findById(7);
    }

    @Test
    void updateDetachesSubCategoriesRemovedFromDto() {
        Category old = CategoryFixture.aCategoryWithSubCategories(1, "Sales", 7, 8);
        Category staleChild = old.getSubCategories().stream()
                .filter(c -> c.getId() == 8)
                .findFirst()
                .orElseThrow();

        CategoryDTO dto = CategoryFixture.aDtoWithIdAndName(1, "Sales");
        dto.setSubCategories(new HashSet<>(Collections.singletonList(7))); // dropped 8

        when(repository.existsById(1)).thenReturn(true);
        when(repository.existsById(7)).thenReturn(true);
        when(repository.findById(1)).thenReturn(Optional.of(old));
        Category saved = CategoryFixture.aCategoryWithId(1, "Sales");
        when(repository.save(any(Category.class))).thenReturn(saved);

        service.update(dto);

        // The dropped child has had its parent nulled out.
        assertThat(staleChild.getParentCategory()).isNull();
    }

    @Test
    void updateDetachesAllOldSubCategoriesWhenDtoSubsIsNull() {
        Category old = CategoryFixture.aCategoryWithSubCategories(1, "Sales", 7, 8);

        CategoryDTO dto = CategoryFixture.aDtoWithIdAndName(1, "Sales");
        // dto.subCategories left null intentionally

        when(repository.existsById(1)).thenReturn(true);
        when(repository.findById(1)).thenReturn(Optional.of(old));
        Category saved = CategoryFixture.aCategoryWithId(1, "Sales");
        when(repository.save(any(Category.class))).thenReturn(saved);

        service.update(dto);

        // Every previous child has been orphaned.
        assertThat(old.getSubCategories())
                .allSatisfy(child -> assertThat(child.getParentCategory()).isNull());
    }

    @Test
    void updateThrowsSubCategoryNotFoundWhenAnyDtoSubDoesNotExist() {
        Category old = CategoryFixture.aCategoryWithSubCategories(1, "Sales", 7);

        CategoryDTO dto = CategoryFixture.aDtoWithIdAndName(1, "Sales");
        dto.setSubCategories(new HashSet<>(Collections.singletonList(99)));

        when(repository.existsById(1)).thenReturn(true);
        when(repository.findById(1)).thenReturn(Optional.of(old));
        when(repository.existsById(99)).thenReturn(false);

        assertThatThrownBy(() -> service.update(dto))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("SUB_CATEGORY_NOT_FOUND")
                .hasMessageContaining("99");
    }

    @Test
    void updateThrowsCycleHasFoundWhenSavedEntityFormsParentLoopById() {
        Category old = CategoryFixture.aCategoryWithId(1, "Sales");
        CategoryDTO dto = CategoryFixture.aDtoWithIdAndName(1, "Sales-Renamed");
        dto.setParentCategory(2);

        when(repository.existsById(1)).thenReturn(true);
        when(repository.findById(1)).thenReturn(Optional.of(old));
        when(repository.existsByNameEqualsIgnoreCase("Sales-Renamed")).thenReturn(false);

        // saved.parent.parent.id == saved.id → cycle.
        Category saved = CategoryFixture.aCategoryWithId(1, "Sales-Renamed");
        Category parentRef = CategoryFixture.aCategoryWithId(2, "ParentRef");
        Category backRef = CategoryFixture.aCategoryWithId(1, "Loop"); // same id as saved
        parentRef.setParentCategory(backRef);
        saved.setParentCategory(parentRef);
        when(repository.save(any(Category.class))).thenReturn(saved);

        assertThatThrownBy(() -> service.update(dto))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("CYCLE_HAS_FOUND");
    }

    // ── get / getAll / getAllByIds ────────────────────────────────────────────

    @Test
    void getReturnsCategoryWhenIdExists() {
        Category category = CategoryFixture.aCategoryWithId(1, "Sales");
        when(repository.findById(1)).thenReturn(Optional.of(category));

        Category result = service.get(1);

        assertThat(result).isSameAs(category);
    }

    @Test
    void getThrowsCategoryNotFoundWhenIdDoesNotExist() {
        when(repository.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.get(99))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("CATEGORY_NOT_FOUND");
    }

    @Test
    void getAllReturnsRepositoryResult() {
        List<Category> all = List.of(
                CategoryFixture.aCategoryWithId(1, "A"),
                CategoryFixture.aCategoryWithId(2, "B")
        );
        when(repository.findAll()).thenReturn(all);

        List<Category> result = service.getAll();

        assertThat(result).isSameAs(all);
    }

    @Test
    void getAllByIdsDelegatesToRepository() {
        List<Integer> ids = List.of(1, 2);
        List<Category> categories = List.of(CategoryFixture.aCategoryWithId(1, "A"));
        when(repository.findAllById(ids)).thenReturn(categories);

        List<Category> result = service.getAllByIds(ids);

        assertThat(result).isSameAs(categories);
    }

    // ── deleteOnly ────────────────────────────────────────────────────────────

    @Test
    void deleteOnlyNullsConnectionCategoryForEachRelatedConnection() {
        Category category = CategoryFixture.aCategoryWithId(1, "Sales");
        Connection c1 = mock(Connection.class);
        Connection c2 = mock(Connection.class);

        when(repository.findById(1)).thenReturn(Optional.of(category));
        when(connectionService.getAllByCategoryId(1)).thenReturn(List.of(c1, c2));

        service.deleteOnly(1);

        verify(connectionService).updateCategory(c1, null);
        verify(connectionService).updateCategory(c2, null);
    }

    @Test
    void deleteOnlyDetachesSubCategoriesByNullingTheirParent() {
        Category category = CategoryFixture.aCategoryWithSubCategories(1, "Sales", 7, 8);

        when(repository.findById(1)).thenReturn(Optional.of(category));
        when(connectionService.getAllByCategoryId(1)).thenReturn(Collections.emptyList());

        service.deleteOnly(1);

        assertThat(category.getSubCategories())
                .allSatisfy(child -> assertThat(child.getParentCategory()).isNull());
    }

    @Test
    void deleteOnlyDeletesTheCategoryAfterDetachingDependents() {
        Category category = CategoryFixture.aCategoryWithId(1, "Sales");

        when(repository.findById(1)).thenReturn(Optional.of(category));
        when(connectionService.getAllByCategoryId(1)).thenReturn(Collections.emptyList());

        service.deleteOnly(1);

        verify(repository).deleteById(1);
    }

    @Test
    void deleteOnlySkipsSubDetachmentWhenSubCategoriesIsNull() {
        Category category = CategoryFixture.aCategoryWithId(1, "Sales");
        category.setSubCategories(null);

        when(repository.findById(1)).thenReturn(Optional.of(category));
        when(connectionService.getAllByCategoryId(1)).thenReturn(Collections.emptyList());

        service.deleteOnly(1);

        // No child save attempted — confirms the null-guard short-circuits.
        verify(repository, never()).save(any());
        verify(repository).deleteById(1);
    }

    @Test
    void deleteOnlyThrowsWhenCategoryDoesNotExist() {
        when(repository.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.deleteOnly(99))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("CATEGORY_NOT_FOUND");

        verify(repository, never()).deleteById(99);
    }

    // ── deleteAllOnly ─────────────────────────────────────────────────────────

    @Test
    void deleteAllOnlyReturnsEarlyWhenIdsIsNull() {
        service.deleteAllOnly(null);

        verifyNoInteractions(repository, connectionService);
    }

    @Test
    void deleteAllOnlyThrowsWhenAnyIdDoesNotExist() {
        when(repository.existsById(1)).thenReturn(true);
        when(repository.existsById(2)).thenReturn(false);

        assertThatThrownBy(() -> service.deleteAllOnly(List.of(1, 2)))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("CATEGORY_NOT_FOUND");

        verify(repository, never()).deleteById(any());
    }

    @Test
    void deleteAllOnlyContinuesWhenOneDeletionFails() {
        Category cat1 = CategoryFixture.aCategoryWithId(1, "A");
        Category cat2 = CategoryFixture.aCategoryWithId(2, "B");

        when(repository.existsById(1)).thenReturn(true);
        when(repository.existsById(2)).thenReturn(true);

        // First findById succeeds, but deleteById throws on the first id — the
        // loop must catch and proceed to the second.
        when(repository.findById(1)).thenReturn(Optional.of(cat1));
        when(repository.findById(2)).thenReturn(Optional.of(cat2));
        when(connectionService.getAllByCategoryId(1)).thenReturn(Collections.emptyList());
        when(connectionService.getAllByCategoryId(2)).thenReturn(Collections.emptyList());

        org.mockito.Mockito.doThrow(new RuntimeException("boom")).when(repository).deleteById(1);

        service.deleteAllOnly(List.of(1, 2));

        verify(repository).deleteById(2); // second id was still attempted
    }

    @Test
    void deleteAllOnlyDeletesEveryProvidedId() {
        Category cat1 = CategoryFixture.aCategoryWithId(1, "A");
        Category cat2 = CategoryFixture.aCategoryWithId(2, "B");

        when(repository.existsById(1)).thenReturn(true);
        when(repository.existsById(2)).thenReturn(true);
        when(repository.findById(1)).thenReturn(Optional.of(cat1));
        when(repository.findById(2)).thenReturn(Optional.of(cat2));
        when(connectionService.getAllByCategoryId(1)).thenReturn(Collections.emptyList());
        when(connectionService.getAllByCategoryId(2)).thenReturn(Collections.emptyList());

        service.deleteAllOnly(List.of(1, 2));

        verify(repository).deleteById(1);
        verify(repository).deleteById(2);
    }

    // ── cascadeDelete ─────────────────────────────────────────────────────────

    @Test
    void cascadeDeleteRemovesConnectionsAndCategoryWhenLeaf() {
        Category leaf = CategoryFixture.aCategoryWithId(1, "Leaf");
        Connection c1 = mock(Connection.class);

        when(repository.findById(1)).thenReturn(Optional.of(leaf));
        when(connectionService.getAllByCategoryId(1)).thenReturn(List.of(c1));

        service.cascadeDelete(1);

        verify(connectionService).deleteAll(List.of(c1));
        verify(repository).deleteById(1);
    }

    @Test
    void cascadeDeleteRecursesIntoEntireSubtreeAndDeletesEveryLevel() {
        Category root = CategoryFixture.aThreeLevelChain(); // 10 → 11 → 12
        Category level1 = root.getSubCategories().iterator().next();
        Category level2 = level1.getSubCategories().iterator().next();

        when(repository.findById(10)).thenReturn(Optional.of(root));
        when(repository.findById(11)).thenReturn(Optional.of(level1));
        when(repository.findById(12)).thenReturn(Optional.of(level2));
        when(connectionService.getAllByCategoryId(org.mockito.ArgumentMatchers.anyInt()))
                .thenReturn(Collections.emptyList());

        service.cascadeDelete(10);

        verify(repository).deleteById(10);
        verify(repository).deleteById(11);
        verify(repository).deleteById(12);
    }

    @Test
    void cascadeDeleteThrowsWhenIdDoesNotExist() {
        when(repository.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.cascadeDelete(99))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("CATEGORY_NOT_FOUND");

        verify(repository, never()).deleteById(any());
    }

    // ── cascadeDeleteAll ──────────────────────────────────────────────────────

    @Test
    void cascadeDeleteAllReturnsEarlyWhenIdsIsNull() {
        service.cascadeDeleteAll(null);

        verifyNoInteractions(repository, connectionService);
    }

    @Test
    void cascadeDeleteAllThrowsWhenAnyIdDoesNotExist() {
        when(repository.existsById(1)).thenReturn(true);
        when(repository.existsById(2)).thenReturn(false);

        assertThatThrownBy(() -> service.cascadeDeleteAll(List.of(1, 2)))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("CATEGORY_NOT_FOUND")
                .hasMessageContaining("2");

        verify(repository, never()).deleteById(any());
    }

    @Test
    void cascadeDeleteAllSkipsCategoryWhenItDisappearsBetweenChecks() {
        // Pre-check claims both exist…
        when(repository.existsById(1)).thenReturn(true);
        when(repository.existsById(2)).thenReturn(true);
        // …but on the second pass id=1 is already gone (concurrent delete).
        when(repository.findById(1)).thenReturn(Optional.empty());
        Category cat2 = CategoryFixture.aCategoryWithId(2, "B");
        when(repository.findById(2)).thenReturn(Optional.of(cat2));
        when(connectionService.getAllByCategoryId(2)).thenReturn(Collections.emptyList());

        service.cascadeDeleteAll(List.of(1, 2));

        // Id 1 was skipped, id 2 was processed normally.
        verify(repository, never()).deleteById(1);
        verify(repository).deleteById(2);
    }

    @Test
    void cascadeDeleteAllDeletesEveryProvidedSubtree() {
        Category cat1 = CategoryFixture.aCategoryWithId(1, "A");
        Category cat2 = CategoryFixture.aCategoryWithId(2, "B");

        when(repository.existsById(1)).thenReturn(true);
        when(repository.existsById(2)).thenReturn(true);
        when(repository.findById(1)).thenReturn(Optional.of(cat1));
        when(repository.findById(2)).thenReturn(Optional.of(cat2));
        when(connectionService.getAllByCategoryId(1)).thenReturn(Collections.emptyList());
        when(connectionService.getAllByCategoryId(2)).thenReturn(Collections.emptyList());

        service.cascadeDeleteAll(List.of(1, 2));

        verify(repository).deleteById(1);
        verify(repository).deleteById(2);
    }

    // ── exists / existsByName ─────────────────────────────────────────────────

    @Test
    void existsReturnsTrueWhenRepositoryReportsExists() {
        when(repository.existsById(1)).thenReturn(true);

        assertThat(service.exists(1)).isTrue();
    }

    @Test
    void existsReturnsFalseWhenRepositoryReportsAbsent() {
        when(repository.existsById(1)).thenReturn(false);

        assertThat(service.exists(1)).isFalse();
    }

    @Test
    void existsByNameReturnsTrueWhenRepositoryReportsExists() {
        when(repository.existsByNameEqualsIgnoreCase("Sales")).thenReturn(true);

        assertThat(service.existsByName("Sales")).isTrue();
    }

    @Test
    void existsByNameReturnsFalseWhenRepositoryReportsAbsent() {
        when(repository.existsByNameEqualsIgnoreCase("Missing")).thenReturn(false);

        assertThat(service.existsByName("Missing")).isFalse();
    }
}
