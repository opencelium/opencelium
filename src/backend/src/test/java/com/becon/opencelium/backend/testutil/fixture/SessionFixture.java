/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.testutil.fixture;

import com.becon.opencelium.backend.database.mysql.entity.Session;

import java.util.UUID;

/**
 * Object mother for {@link Session} test data.
 *
 * Use the named factory methods in test classes — never construct
 * Session inline. Add new named scenarios here instead of duplicating
 * setup across test classes.
 */
public final class SessionFixture {

    private SessionFixture() {}

    /**
     * Fresh, active session for the given user with zero failed attempts.
     * Use as the default for most tests.
     */
    public static Session anActiveSession(int userId) {
        Session session = new Session();
        session.setId(UUID.randomUUID().toString());
        session.setUserId(userId);
        session.setActive(true);
        session.setAttempts(0);
        return session;
    }

    /**
     * Session with a deterministic id — used when a test needs to
     * assert on or look up by a specific session id.
     */
    public static Session aSessionWithId(String id, int userId) {
        Session session = new Session();
        session.setId(id);
        session.setUserId(userId);
        session.setActive(true);
        session.setAttempts(0);
        return session;
    }

    /**
     * Session whose TOTP attempt counter is exhausted ({@code attempts == 4}).
     * Used to pin the current attempts-reset behaviour of
     * {@code SessionServiceImpl.replace(int)} — see the corresponding test.
     */
    public static Session anExhaustedSession(int userId) {
        Session session = new Session();
        session.setId(UUID.randomUUID().toString());
        session.setUserId(userId);
        session.setActive(true);
        session.setAttempts(4);
        return session;
    }

    /**
     * Inactive session — produced by {@code UserController.logout}.
     * Use to verify lookup paths still return inactive rows.
     */
    public static Session anInactiveSession(int userId) {
        Session session = anActiveSession(userId);
        session.setActive(false);
        return session;
    }
}
