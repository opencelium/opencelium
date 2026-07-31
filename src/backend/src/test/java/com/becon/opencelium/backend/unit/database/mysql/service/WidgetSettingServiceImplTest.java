/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.database.mysql.entity.Widget;
import com.becon.opencelium.backend.database.mysql.entity.WidgetSetting;
import com.becon.opencelium.backend.database.mysql.repository.WidgetSettingRepository;
import com.becon.opencelium.backend.database.mysql.service.UserService;
import com.becon.opencelium.backend.database.mysql.service.WidgetService;
import com.becon.opencelium.backend.database.mysql.service.WidgetSettingServiceImp;
import com.becon.opencelium.backend.resource.user.WidgetSettingResource;
import com.becon.opencelium.backend.testutil.fixture.UserFixture;
import com.becon.opencelium.backend.testutil.fixture.WidgetFixture;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link WidgetSettingServiceImp}.
 *
 * No Spring context is loaded. All collaborators are mocked with Mockito.
 * Run with: ./gradlew test --tests "*.WidgetSettingServiceImplTest"
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("WidgetSettingServiceImp — unit")
class WidgetSettingServiceImplTest {

    @Mock
    private WidgetSettingRepository widgetSettingRepository;

    @Mock
    private WidgetService widgetServiceImp;

    @Mock
    private UserService userService;

    @InjectMocks
    private WidgetSettingServiceImp widgetSettingService;

    // ── create ────────────────────────────────────────────────────────────────

    @Test
    void createPersistsWidgetSettingWhenCalled() {
        WidgetSetting ws = WidgetFixture.aWidgetSetting(WidgetFixture.aWidget());

        widgetSettingService.create(ws);

        verify(widgetSettingRepository).save(ws);
    }

    // ── update ────────────────────────────────────────────────────────────────

    @Test
    void updatePersistsWidgetSettingWhenCalled() {
        WidgetSetting ws = WidgetFixture.aWidgetSetting(WidgetFixture.aWidget());

        widgetSettingService.update(ws);

        verify(widgetSettingRepository).save(ws);
    }

    // ── findById ──────────────────────────────────────────────────────────────

    @Test
    void findByIdReturnsWidgetSettingWhenIdExists() {
        WidgetSetting ws = WidgetFixture.aWidgetSetting(WidgetFixture.aWidget());
        when(widgetSettingRepository.findById(10)).thenReturn(Optional.of(ws));

        WidgetSetting result = widgetSettingService.findById(10);

        assertThat(result.getId()).isEqualTo(10);
        assertThat(result.getWidth()).isEqualTo(4);
    }

    @Test
    void findByIdThrowsRuntimeExceptionWhenIdDoesNotExist() {
        when(widgetSettingRepository.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> widgetSettingService.findById(99))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("WidgetNotFound");
    }

    // ── deleteById ────────────────────────────────────────────────────────────

    @Test
    void deleteByIdRemovesWidgetSettingWhenIdProvided() {
        widgetSettingService.deleteById(10);

        verify(widgetSettingRepository).deleteById(10);
    }

    // ── saveAll ───────────────────────────────────────────────────────────────

    @Test
    void saveAllPersistsAllWidgetSettingsWhenCalled() {
        List<WidgetSetting> widgetSettings = List.of(
                WidgetFixture.aWidgetSetting(WidgetFixture.aWidget()));

        widgetSettingService.saveAll(widgetSettings);

        verify(widgetSettingRepository).saveAll(widgetSettings);
    }

    // ── deleteAll ─────────────────────────────────────────────────────────────

    @Test
    void deleteAllRemovesAllWidgetSettingsWhenCalled() {
        widgetSettingService.deleteAll();

        verify(widgetSettingRepository).deleteAll();
    }

    // ── findAllByUserId / findByUserId ────────────────────────────────────────

    @Test
    void findAllByUserIdReturnsSettingsWhenUserHasWidgetSettings() {
        User user = UserFixture.anEmptyUser();
        user.setId(5);
        WidgetSetting ws = WidgetFixture.aWidgetSetting(WidgetFixture.aWidget(), user);
        when(widgetSettingRepository.findByUserId(5)).thenReturn(List.of(ws));

        List<WidgetSetting> result = widgetSettingService.findAllByUserId(5);

        assertThat(result).hasSize(1);
        verify(widgetSettingRepository).findByUserId(5);
    }

    @Test
    void findByUserIdReturnsSettingsWhenUserHasWidgetSettings() {
        User user = UserFixture.anEmptyUser();
        user.setId(5);
        WidgetSetting ws = WidgetFixture.aWidgetSetting(WidgetFixture.aWidget(), user);
        when(widgetSettingRepository.findByUserId(5)).thenReturn(List.of(ws));

        List<WidgetSetting> result = widgetSettingService.findByUserId(5);

        assertThat(result).hasSize(1);
        verify(widgetSettingRepository).findByUserId(5);
    }

    // ── toResource ────────────────────────────────────────────────────────────

    @Test
    void toResourceConvertsEntityToResourceWhenEntityIsValid() {
        Widget widget = WidgetFixture.aWidget();
        WidgetSetting ws = WidgetFixture.aWidgetSetting(widget);

        WidgetSettingResource resource = widgetSettingService.toResource(ws);

        assertThat(resource.getWidgetId()).isEqualTo(widget.getId());
        assertThat(resource.getI()).isEqualTo(widget.getName());
        assertThat(resource.getX()).isEqualTo(ws.getAxisX());
        assertThat(resource.getY()).isEqualTo(ws.getAxisY());
        assertThat(resource.getW()).isEqualTo(ws.getWidth());
        assertThat(resource.getH()).isEqualTo(ws.getHeight());
        assertThat(resource.getMinW()).isEqualTo(ws.getMinWidth());
        assertThat(resource.getMinH()).isEqualTo(ws.getMinHeight());
    }

    // ── toEntity ──────────────────────────────────────────────────────────────

    @Test
    void toEntityReturnsWidgetSettingWhenBothWidgetAndUserExist() {
        WidgetSettingResource resource = WidgetFixture.aWidgetSettingResource();
        Widget widget = WidgetFixture.aWidget();
        User user = UserFixture.anEmptyUser();
        user.setId(5);
        when(widgetServiceImp.findById(resource.getWidgetId())).thenReturn(Optional.of(widget));
        when(userService.findById(5)).thenReturn(Optional.of(user));

        WidgetSetting result = widgetSettingService.toEntity(resource, 5);

        assertThat(result.getWidget()).isEqualTo(widget);
        assertThat(result.getUser()).isEqualTo(user);
        assertThat(result.getWidth()).isEqualTo(resource.getW());
        assertThat(result.getHeight()).isEqualTo(resource.getH());
    }

    @Test
    void toEntityThrowsRuntimeExceptionWhenWidgetNotFound() {
        WidgetSettingResource resource = WidgetFixture.aWidgetSettingResource();
        when(widgetServiceImp.findById(resource.getWidgetId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> widgetSettingService.toEntity(resource, 5))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Widget not found");
    }

    @Test
    void toEntityThrowsRuntimeExceptionWhenUserNotFound() {
        WidgetSettingResource resource = WidgetFixture.aWidgetSettingResource();
        Widget widget = WidgetFixture.aWidget();
        when(widgetServiceImp.findById(resource.getWidgetId())).thenReturn(Optional.of(widget));
        when(userService.findById(5)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> widgetSettingService.toEntity(resource, 5))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("User not found");
    }
}
