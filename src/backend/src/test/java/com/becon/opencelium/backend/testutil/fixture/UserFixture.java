/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.testutil.fixture;

import com.becon.opencelium.backend.database.mysql.entity.User;

/**
 * Object mother for {@link User} test data.
 *
 * Use the named factory methods in test classes — never construct
 * User objects inline. Add new named scenarios here rather than
 * duplicating setup across test classes.
 */
public final class UserFixture {

    private UserFixture() {}

    /**
     * User with no fields set beyond JVM defaults (id = 0, authMethod = BASIC).
     * Use when a test only needs a valid FK target and no User fields are under test.
     */
    public static User anEmptyUser() {
        return new User();
    }
}
