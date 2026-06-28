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
 * Short-lived OIDC login transaction carried in a signed cookie between {@code /oidc/authorize}
 * and {@code /oidc/callback}. Holds the CSRF {@code state}, the replay-protection {@code nonce},
 * the PKCE {@code codeVerifier}, the backend {@code redirectUri} used in the authorization request
 * and the SPA URL to bounce back to once login completes.
 */
public class OidcLoginTransaction {
    private String state;
    private String nonce;
    private String codeVerifier;
    private String redirectUri;
    private String frontendRedirectUri;

    public OidcLoginTransaction() {
    }

    public OidcLoginTransaction(String state, String nonce, String codeVerifier,
                                String redirectUri, String frontendRedirectUri) {
        this.state = state;
        this.nonce = nonce;
        this.codeVerifier = codeVerifier;
        this.redirectUri = redirectUri;
        this.frontendRedirectUri = frontendRedirectUri;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getNonce() {
        return nonce;
    }

    public void setNonce(String nonce) {
        this.nonce = nonce;
    }

    public String getCodeVerifier() {
        return codeVerifier;
    }

    public void setCodeVerifier(String codeVerifier) {
        this.codeVerifier = codeVerifier;
    }

    public String getRedirectUri() {
        return redirectUri;
    }

    public void setRedirectUri(String redirectUri) {
        this.redirectUri = redirectUri;
    }

    public String getFrontendRedirectUri() {
        return frontendRedirectUri;
    }

    public void setFrontendRedirectUri(String frontendRedirectUri) {
        this.frontendRedirectUri = frontendRedirectUri;
    }
}
