/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.systemsetting;

import com.becon.opencelium.backend.controller.SystemSettingController;
import com.becon.opencelium.backend.resource.SystemSettingDTO;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.multipart.MultipartFile;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies that the controller methods carry the intended authorization annotations. Enforcement
 * at runtime is provided by Spring's method security AOP, which we cannot exercise inside a
 * {@code @WebMvcTest} slice without the full security configuration. Note the authority must be
 * the raw role name {@code 'Admin'} — see {@code UserPrincipals#getAuthorities()}.
 */
@DisplayName("SystemSettingController — security annotations")
class SystemSettingControllerSecurityAnnotationsTest {

    @Test
    void getEndpointAllowsAdminOrWhitelistedSetting() throws NoSuchMethodException {
        Method getMethod = SystemSettingController.class.getDeclaredMethod("get", String.class);

        PreAuthorize preAuthorize = getMethod.getAnnotation(PreAuthorize.class);

        assertThat(preAuthorize).isNotNull();
        assertThat(preAuthorize.value())
                .isEqualTo("hasAuthority('Admin') or @systemSettingSecurity.isUserReadable(#name)");
    }

    @Test
    void putEndpointRequiresAdminRole() throws NoSuchMethodException {
        Method putMethod = SystemSettingController.class.getDeclaredMethod(
                "put", String.class, SystemSettingDTO.class);

        PreAuthorize preAuthorize = putMethod.getAnnotation(PreAuthorize.class);

        assertThat(preAuthorize).isNotNull();
        assertThat(preAuthorize.value()).isEqualTo("hasAuthority('Admin')");
    }

    @Test
    void deleteEndpointRequiresAdminRole() throws NoSuchMethodException {
        Method deleteMethod = SystemSettingController.class.getDeclaredMethod("delete", String.class);

        PreAuthorize preAuthorize = deleteMethod.getAnnotation(PreAuthorize.class);

        assertThat(preAuthorize).isNotNull();
        assertThat(preAuthorize.value()).isEqualTo("hasAuthority('Admin')");
    }

    @Test
    void uploadLogoEndpointRequiresAdminRole() throws NoSuchMethodException {
        Method uploadMethod = SystemSettingController.class.getDeclaredMethod(
                "uploadLogo", MultipartFile.class);

        PreAuthorize preAuthorize = uploadMethod.getAnnotation(PreAuthorize.class);

        assertThat(preAuthorize).isNotNull();
        assertThat(preAuthorize.value()).isEqualTo("hasAuthority('Admin')");
    }

    @Test
    void deleteLogoEndpointRequiresAdminRole() throws NoSuchMethodException {
        Method deleteLogoMethod = SystemSettingController.class.getDeclaredMethod("deleteLogo");

        PreAuthorize preAuthorize = deleteLogoMethod.getAnnotation(PreAuthorize.class);

        assertThat(preAuthorize).isNotNull();
        assertThat(preAuthorize.value()).isEqualTo("hasAuthority('Admin')");
    }
}
