/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.controller;

import com.becon.opencelium.backend.controller.UserController;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies that the {@link UserController} methods carry the intended authorization annotations.
 * Enforcement at runtime is provided by Spring's method security AOP, which a {@code @WebMvcTest}
 * slice cannot exercise without the full security configuration. Note the authority must be the
 * raw role name {@code 'Admin'} — see {@code UserPrincipals#getAuthorities()}.
 */
@DisplayName("UserController — security annotations")
class UserControllerSecurityAnnotationsTest {

    @Test
    void createPasswordLinkRequiresAdminRoleWhenCalled() throws NoSuchMethodException {
        Method method = UserController.class.getDeclaredMethod("createPasswordLink", int.class, boolean.class);

        PreAuthorize preAuthorize = method.getAnnotation(PreAuthorize.class);

        assertThat(preAuthorize).isNotNull();
        assertThat(preAuthorize.value()).isEqualTo("hasAuthority('Admin')");
    }
}
