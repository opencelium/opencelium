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
 * Result of building an OIDC authorization request: the provider URL to redirect the browser to,
 * and the {@link OidcLoginTransaction} that must be persisted (in a signed cookie) for the callback.
 */
public class OidcAuthorization {
    private final String authorizationRequestUri;
    private final OidcLoginTransaction transaction;

    public OidcAuthorization(String authorizationRequestUri, OidcLoginTransaction transaction) {
        this.authorizationRequestUri = authorizationRequestUri;
        this.transaction = transaction;
    }

    public String getAuthorizationRequestUri() {
        return authorizationRequestUri;
    }

    public OidcLoginTransaction getTransaction() {
        return transaction;
    }
}
