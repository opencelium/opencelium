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
 * Raised when an OIDC login cannot be completed. The {@code reason} is a short machine-readable code
 * (e.g. {@code user_not_provisioned}, {@code invalid_nonce}) propagated to the SPA callback as a query
 * parameter so the login page can show an appropriate message.
 */
public class OidcLoginException extends RuntimeException {
    private final String reason;

    public OidcLoginException(String reason) {
        super(reason);
        this.reason = reason;
    }

    public OidcLoginException(String reason, Throwable cause) {
        super(reason, cause);
        this.reason = reason;
    }

    public String getReason() {
        return reason;
    }
}
