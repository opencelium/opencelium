/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.applicationConfig;

import com.becon.opencelium.backend.controller.ApplicationConfigController;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies that the controller methods carry the admin-only authorization
 * annotation. Enforcement at runtime is provided by Spring's method security
 * AOP, which we cannot exercise inside a @WebMvcTest slice without the full
 * security configuration.
 */
@DisplayName("ApplicationConfigController — admin-only security annotations")
class ApplicationConfigControllerSecurityAnnotationsTest {

    @Test
    void getEndpointRequiresAdminRole() throws NoSuchMethodException {
        Method getMethod = ApplicationConfigController.class.getDeclaredMethod("get");

        PreAuthorize preAuthorize = getMethod.getAnnotation(PreAuthorize.class);

        assertThat(preAuthorize).isNotNull();
        assertThat(preAuthorize.value()).isEqualTo("hasAuthority('Admin')");
    }

    @Test
    void patchEndpointRequiresAdminRole() throws NoSuchMethodException {
        Method patchMethod = ApplicationConfigController.class.getDeclaredMethod(
                "patch", com.fasterxml.jackson.databind.JsonNode.class);

        PreAuthorize preAuthorize = patchMethod.getAnnotation(PreAuthorize.class);

        assertThat(preAuthorize).isNotNull();
        assertThat(preAuthorize.value()).isEqualTo("hasAuthority('Admin')");
    }
}
