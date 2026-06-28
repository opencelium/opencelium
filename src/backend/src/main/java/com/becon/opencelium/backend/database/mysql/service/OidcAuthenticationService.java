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

package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.security.oidc.OidcAuthorization;
import com.becon.opencelium.backend.security.oidc.OidcLoginTicket;
import com.becon.opencelium.backend.security.oidc.OidcLoginTransaction;

public interface OidcAuthenticationService {

    /**
     * Builds the provider authorization request (with state, nonce and PKCE) the browser is redirected
     * to, and the transaction that must be stored for the callback.
     */
    OidcAuthorization createAuthorization(String backendRedirectUri, String frontendRedirectUri);

    /**
     * Completes the flow: exchanges the code (authenticating the client), validates the ID token and
     * nonce, provisions/updates the user and issues an OpenCelium session + JWT. Returns a single-use
     * one-time code the SPA exchanges at {@code /oidc/token}.
     *
     * @throws com.becon.opencelium.backend.security.oidc.OidcLoginException on any failure
     */
    String login(String code, OidcLoginTransaction transaction, String backendRedirectUri);

    /**
     * Consumes a one-time code, returning the associated user id and OpenCelium JWT. Single use.
     */
    OidcLoginTicket consumeTicket(String oneTimeCode);
}
