/*
 * // Copyright (C) <2020> <becon GmbH>
 * //
 * // This program is free software: you can redistribute it and/or modify
 * // it under the terms of the GNU General Public License as published by
 * // the Free Software Foundation, version 3 of the License.
 * //
 * // This program is distributed in the hope that it will be useful,
 * // but WITHOUT ANY WARRANTY; without even the implied warranty of
 * // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * // GNU General Public License for more details.
 * //
 * // You should have received a copy of the GNU General Public License
 * // along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

package com.becon.opencelium.backend.security.oidc;

/**
 * Single-use ticket handed to the SPA as a one-time code after a successful OIDC callback. The SPA
 * exchanges the code at {@code POST /oidc/token} to receive the OpenCelium JWT, so the token never
 * travels in a browser-visible URL.
 */
public class OidcLoginTicket {
    private final int userId;
    private final String token;
    private final long expiresAt;

    public OidcLoginTicket(int userId, String token, long expiresAt) {
        this.userId = userId;
        this.token = token;
        this.expiresAt = expiresAt;
    }

    public int getUserId() {
        return userId;
    }

    public String getToken() {
        return token;
    }

    public long getExpiresAt() {
        return expiresAt;
    }
}
