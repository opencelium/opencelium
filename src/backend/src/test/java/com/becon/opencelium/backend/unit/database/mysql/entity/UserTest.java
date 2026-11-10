/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.database.mysql.entity;

import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.testutil.fixture.UserFixture;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for the runtime identifier of {@link User}: the value used as JWT subject, websocket
 * user destination and TOTP label.
 */
class UserTest {

    @Test
    void getPrincipalReturnsEmailWhenEmailIsPresent() {
        User user = UserFixture.anEmptyUser();
        user.setEmail("alice@example.com");
        user.setUsername("alice");

        assertThat(user.getPrincipal()).isEqualTo("alice@example.com");
    }

    @Test
    void getPrincipalReturnsUsernameWhenEmailIsBlank() {
        User user = UserFixture.anEmptyUser();
        user.setEmail("   ");
        user.setUsername("alice");

        assertThat(user.getPrincipal()).isEqualTo("alice");
    }

    @Test
    void getPrincipalReturnsUsernameWhenEmailIsNull() {
        User user = UserFixture.anEmptyUser();
        user.setEmail(null);
        user.setUsername("alice");

        assertThat(user.getPrincipal()).isEqualTo("alice");
    }

    @Test
    void getPrincipalReturnsNullWhenNeitherIsSet() {
        User user = UserFixture.anEmptyUser();
        user.setEmail(null);
        user.setUsername("  ");

        assertThat(user.getPrincipal()).isNull();
    }
}
