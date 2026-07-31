/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.testutil.fixture;

import com.becon.opencelium.backend.database.mysql.entity.PasswordResetToken;
import com.becon.opencelium.backend.database.mysql.entity.User;

import java.util.Date;

/**
 * Object mother for {@link PasswordResetToken} test data.
 *
 * Use the named factory methods in test classes — never construct
 * PasswordResetToken inline. Add new named scenarios here instead of
 * duplicating setup across test classes.
 *
 * {@code createdAt} controls both the per-token activity window and the
 * cumulative lockout window in {@code PasswordResetServiceImpl}, so the
 * helpers below let tests place a token anywhere on that timeline.
 */
public final class PasswordResetTokenFixture {

    private PasswordResetTokenFixture() {}

    /**
     * Valid, unused token with {@code createdAt = now}. Fresh enough to be
     * inside any non-trivial activity window — use as the "active token" case.
     */
    public static PasswordResetToken aFreshTokenFor(User user, String hashedToken) {
        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setToken(hashedToken);
        token.setCreatedAt(new Date());
        token.setUsed(false);
        token.setValid(true);
        return token;
    }

    /**
     * Valid, unused token whose {@code createdAt} is {@code millisAgo}
     * milliseconds in the past. Use to land a token inside or outside the
     * activity / lockout windows deterministically.
     */
    public static PasswordResetToken aTokenCreatedMillisAgo(User user, String hashedToken, long millisAgo) {
        PasswordResetToken token = aFreshTokenFor(user, hashedToken);
        token.setCreatedAt(new Date(System.currentTimeMillis() - millisAgo));
        return token;
    }
}
