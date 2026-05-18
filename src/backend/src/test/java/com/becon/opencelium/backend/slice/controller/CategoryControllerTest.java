/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.slice.controller;

import com.becon.opencelium.backend.configuration.interceptors.MasterPasswordInterceptor;
import com.becon.opencelium.backend.controller.CategoryController;
import com.becon.opencelium.backend.database.mysql.entity.Category;
import com.becon.opencelium.backend.database.mysql.service.CategoryService;
import com.becon.opencelium.backend.mapper.mysql.CategoryResponseMapper;
import com.becon.opencelium.backend.resource.CategoryDTO;
import com.becon.opencelium.backend.resource.CategoryResponseDTO;
import com.becon.opencelium.backend.security.AuthenticationFilter;
import com.becon.opencelium.backend.security.AuthorizationFilter;
import com.becon.opencelium.backend.security.TotpAuthenticationFilter;
import com.becon.opencelium.backend.storage.StorageService;
import com.becon.opencelium.backend.testutil.fixture.CategoryFixture;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Slice tests for {@link CategoryController}.
 *
 * Loads only the web layer — no service or repository beans. Security
 * auto-config is excluded by application-test.yml so no filters stand
 * between MockMvc and the controller.
 *
 * RuntimeExceptions thrown by the service map to HTTP 500 via the catch-all
 * {@code ResponseExceptionHandler}; the controller has no dedicated handler
 * for category errors, so 500 is the actual contract here.
 *
 * Run with: ./gradlew test --tests "*.CategoryControllerTest"
 */
@WebMvcTest(
        controllers = CategoryController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = {
                        AuthenticationFilter.class,
                        AuthorizationFilter.class,
                        TotpAuthenticationFilter.class
                }
        )
)
@ActiveProfiles("test")
@DisplayName("CategoryController — web slice")
class CategoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    // Explicit bean name matches the @Qualifier("categoryServiceImp") on the
    // controller constructor. Without name=, Spring registers the mock under
    // a generated name and the qualifier lookup fails to find it.
    @MockBean(name = "categoryServiceImp")
    private CategoryService categoryService;

    @MockBean
    private CategoryResponseMapper categoryResponseMapper;

    @MockBean
    private StorageService storageService;

    // Pulled in by RegisterInterceptorsConfig (a WebMvcConfigurer the slice
    // loads). Mocking the interceptor avoids resolving its ConnectorProps
    // @ConfigurationProperties bean, which isn't part of the web slice.
    @MockBean
    private MasterPasswordInterceptor masterPasswordInterceptor;


    // ── GET /category/{id} ────────────────────────────────────────────────────

    @Test
    void getReturnsCategoryWithStatus200WhenIdExists() throws Exception {
        Category entity = CategoryFixture.aCategoryWithId(1, "Sales");
        CategoryResponseDTO dto = CategoryFixture.aResponseDto(1, "Sales");
        when(categoryService.get(1)).thenReturn(entity);
        when(categoryResponseMapper.toDTO(entity)).thenReturn(dto);

        mockMvc.perform(get("/category/{id}", 1).accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Sales"));
    }

    @Test
    void getReturns500WhenServiceThrows() throws Exception {
        when(categoryService.get(99)).thenThrow(new RuntimeException("CATEGORY_NOT_FOUND"));

        mockMvc.perform(get("/category/{id}", 99).accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError());
    }

    // ── GET /category/all ─────────────────────────────────────────────────────

    @Test
    void getAllReturnsCategoriesWithStatus200() throws Exception {
        Category a = CategoryFixture.aCategoryWithId(1, "A");
        Category b = CategoryFixture.aCategoryWithId(2, "B");
        CategoryResponseDTO dtoA = CategoryFixture.aResponseDto(1, "A");
        CategoryResponseDTO dtoB = CategoryFixture.aResponseDto(2, "B");
        when(categoryService.getAll()).thenReturn(List.of(a, b));
        when(categoryResponseMapper.toDTOAll(List.of(a, b))).thenReturn(List.of(dtoA, dtoB));

        mockMvc.perform(get("/category/all").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[1].id").value(2));
    }

    @Test
    void getAllReturnsEmptyArrayWhenNoCategoriesExist() throws Exception {
        when(categoryService.getAll()).thenReturn(List.of());
        when(categoryResponseMapper.toDTOAll(List.of())).thenReturn(List.of());

        mockMvc.perform(get("/category/all").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ── POST /category ────────────────────────────────────────────────────────

    @Test
    void addReturns201WithLocationHeaderAndMappedBodyWhenDtoIsValid() throws Exception {
        Category saved = CategoryFixture.aCategoryWithId(100, "Sales");
        CategoryResponseDTO dto = CategoryFixture.aResponseDto(100, "Sales");
        when(categoryService.add(any(CategoryDTO.class))).thenReturn(100);
        when(categoryService.get(100)).thenReturn(saved);
        when(categoryResponseMapper.toDTO(saved)).thenReturn(dto);

        mockMvc.perform(post("/category")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Sales"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.id").value(100))
                .andExpect(jsonPath("$.name").value("Sales"));
    }

    @Test
    void addReturns500WhenServiceThrows() throws Exception {
        when(categoryService.add(any(CategoryDTO.class)))
                .thenThrow(new RuntimeException("TITLE_HAS_ALREADY_TAKEN"));

        mockMvc.perform(post("/category")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Sales"
                                }
                                """))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void addReturns400WhenJsonBodyIsMalformed() throws Exception {
        mockMvc.perform(post("/category")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{not-valid-json"))
                .andExpect(status().isBadRequest());
    }

    // ── PUT /category/{id} ────────────────────────────────────────────────────

    @Test
    void updateForcesPathIdOntoDtoBeforeDelegatingToService() throws Exception {
        Category updated = CategoryFixture.aCategoryWithId(5, "Sales-Renamed");
        CategoryResponseDTO dto = CategoryFixture.aResponseDto(5, "Sales-Renamed");
        when(categoryService.get(5)).thenReturn(updated);
        when(categoryResponseMapper.toDTO(updated)).thenReturn(dto);

        // Body says id=99 — the controller MUST override it with the path id (5).
        mockMvc.perform(put("/category/{id}", 5)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "id": 99,
                                  "name": "Sales-Renamed"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(5));

        ArgumentCaptor<CategoryDTO> captor = ArgumentCaptor.forClass(CategoryDTO.class);
        verify(categoryService).update(captor.capture());
        assertThat(captor.getValue().getId()).isEqualTo(5);
    }

    @Test
    void updateReturns500WhenServiceThrows() throws Exception {
        doThrow(new RuntimeException("CATEGORY_NOT_FOUND"))
                .when(categoryService).update(any(CategoryDTO.class));

        mockMvc.perform(put("/category/{id}", 1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "X"
                                }
                                """))
                .andExpect(status().isInternalServerError());
    }

    // ── DELETE /category/cascade-delete/{id} ──────────────────────────────────

    @Test
    void cascadeDeleteReturns204AndDelegatesToServiceWhenIdProvided() throws Exception {
        mockMvc.perform(delete("/category/cascade-delete/{id}", 1))
                .andExpect(status().isNoContent());

        verify(categoryService).cascadeDelete(1);
    }

    @Test
    void cascadeDeleteReturns500WhenServiceThrows() throws Exception {
        doThrow(new RuntimeException("CATEGORY_NOT_FOUND"))
                .when(categoryService).cascadeDelete(99);

        mockMvc.perform(delete("/category/cascade-delete/{id}", 99))
                .andExpect(status().isInternalServerError());
    }

    // ── PUT /category/list/cascade-delete ─────────────────────────────────────

    @Test
    void cascadeDeleteFromListReturns204AndForwardsIdentifiersToService() throws Exception {
        mockMvc.perform(put("/category/list/cascade-delete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "identifiers": [1, 2, 3]
                                }
                                """))
                .andExpect(status().isNoContent());

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Integer>> captor = ArgumentCaptor.forClass(List.class);
        verify(categoryService).cascadeDeleteAll(captor.capture());
        assertThat(captor.getValue()).containsExactly(1, 2, 3);
    }

    @Test
    void cascadeDeleteFromListAcceptsEmptyIdentifiers() throws Exception {
        mockMvc.perform(put("/category/list/cascade-delete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "identifiers": []
                                }
                                """))
                .andExpect(status().isNoContent());

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Integer>> captor = ArgumentCaptor.forClass(List.class);
        verify(categoryService).cascadeDeleteAll(captor.capture());
        assertThat(captor.getValue()).isEmpty();
    }

    // ── DELETE /category/{id} ─────────────────────────────────────────────────

    @Test
    void deleteReturns204AndDelegatesToServiceWhenIdProvided() throws Exception {
        mockMvc.perform(delete("/category/{id}", 1))
                .andExpect(status().isNoContent());

        verify(categoryService).deleteOnly(1);
    }

    // ── PUT /category/list/delete ─────────────────────────────────────────────

    @Test
    void deleteFromListReturns204AndForwardsIdentifiersToService() throws Exception {
        mockMvc.perform(put("/category/list/delete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "identifiers": [4, 5]
                                }
                                """))
                .andExpect(status().isNoContent());

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Integer>> captor = ArgumentCaptor.forClass(List.class);
        verify(categoryService).deleteAllOnly(captor.capture());
        assertThat(captor.getValue()).containsExactly(4, 5);
    }

    // ── GET /category/check/{name} ────────────────────────────────────────────

    @Test
    void existsByNameReturnsExistsMessageWithStatus200WhenNameIsTaken() throws Exception {
        when(categoryService.existsByName("Sales")).thenReturn(true);

        mockMvc.perform(get("/category/check/{name}", "Sales").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("EXISTS"))
                .andExpect(jsonPath("$.status").value(200));
    }

    @Test
    void existsByNameReturnsNotExistsMessageWithStatus200WhenNameIsFree() throws Exception {
        when(categoryService.existsByName("Untaken")).thenReturn(false);

        mockMvc.perform(get("/category/check/{name}", "Untaken").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("NOT_EXISTS"))
                .andExpect(jsonPath("$.status").value(200));
    }
}
