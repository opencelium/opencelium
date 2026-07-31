/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.Component;
import com.becon.opencelium.backend.database.mysql.repository.ComponentRepository;
import com.becon.opencelium.backend.database.mysql.service.ComponentServiceImpl;
import com.becon.opencelium.backend.database.mysql.service.PermissionServiceImpl;
import com.becon.opencelium.backend.testutil.fixture.UserRoleFixture;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link ComponentServiceImpl}.
 *
 * Both live methods are thin delegates over {@link ComponentRepository}, so
 * the assertions focus on pass-through semantics. {@code permissionService}
 * is currently an unused dependency — the final test pins that contract so
 * that wiring it in later requires an intentional diff.
 */
@ExtendWith(MockitoExtension.class)
class ComponentServiceImplTest {

    @Mock
    private ComponentRepository componentRepository;

    @Mock
    private PermissionServiceImpl permissionService;

    @InjectMocks
    private ComponentServiceImpl service;

    @Test
    void findByIdReturnsComponentWhenPresent() {
        Component component = UserRoleFixture.aComponent(10, "Module-A");
        when(componentRepository.findById(10)).thenReturn(Optional.of(component));

        Optional<Component> result = service.findById(10);

        assertThat(result).containsSame(component);
    }

    @Test
    void findByIdReturnsEmptyWhenAbsent() {
        when(componentRepository.findById(99)).thenReturn(Optional.empty());

        Optional<Component> result = service.findById(99);

        assertThat(result).isEmpty();
    }

    @Test
    void findAllReturnsComponentsWhenRepositoryHasEntries() {
        List<Component> all = List.of(
                UserRoleFixture.aComponent(10, "Module-A"),
                UserRoleFixture.aComponent(20, "Module-B")
        );
        when(componentRepository.findAll()).thenReturn(all);

        List<Component> result = service.findAll();

        assertThat(result).isSameAs(all);
    }

    @Test
    void findAllReturnsEmptyListWhenRepositoryEmpty() {
        when(componentRepository.findAll()).thenReturn(Collections.emptyList());

        assertThat(service.findAll()).isEmpty();
    }

    @Test
    void publicMethodsDoNotInteractWithPermissionService() {
        when(componentRepository.findById(1)).thenReturn(Optional.empty());
        when(componentRepository.findAll()).thenReturn(Collections.emptyList());

        service.findById(1);
        service.findAll();

        verifyNoInteractions(permissionService);
    }
}
