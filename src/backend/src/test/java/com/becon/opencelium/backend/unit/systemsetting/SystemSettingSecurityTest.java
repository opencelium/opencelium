/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.systemsetting;

import com.becon.opencelium.backend.security.SystemSettingSecurity;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The read whitelist is default-deny: every setting not explicitly listed here is admin-only.
 */
@DisplayName("SystemSettingSecurity — user-readable whitelist")
class SystemSettingSecurityTest {

    private final SystemSettingSecurity security = new SystemSettingSecurity();

    @Test
    void isUserReadableReturnsTrueWhenSettingIsWhitelisted() {
        assertThat(security.isUserReadable("theme_colors")).isTrue();
        assertThat(security.isUserReadable("app_logo")).isTrue();
    }

    @Test
    void isUserReadableReturnsFalseWhenSettingIsNotWhitelisted() {
        assertThat(security.isUserReadable("smtp_password")).isFalse();
        assertThat(security.isUserReadable("opencelium.language.default")).isFalse();
    }

    @Test
    void isUserReadableReturnsFalseWhenNameDiffersInCaseOrIsNull() {
        assertThat(security.isUserReadable("Theme_Colors")).isFalse();
        assertThat(security.isUserReadable(null)).isFalse();
    }
}
