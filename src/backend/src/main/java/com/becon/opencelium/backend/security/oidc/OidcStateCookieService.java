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

import com.becon.opencelium.backend.utility.TokenUtility;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Date;
import java.util.Optional;

/**
 * Persists the {@link OidcLoginTransaction} across the identity-provider round-trip as a signed,
 * HttpOnly, {@code SameSite=Lax} cookie. Signing reuses the application JWT secret
 * ({@link TokenUtility#getSecret()}) so no additional dependency or key material is introduced, and
 * keeps the security chain stateless (no HTTP session).
 */
@Service
public class OidcStateCookieService {
    public static final String COOKIE_NAME = "OC_OIDC_TXN";
    private static final long TTL_SECONDS = 300;

    @Autowired
    private TokenUtility tokenUtility;

    public void write(HttpServletRequest request, HttpServletResponse response, OidcLoginTransaction transaction) {
        String value = sign(transaction);
        ResponseCookie cookie = ResponseCookie.from(COOKIE_NAME, value)
                .httpOnly(true)
                .secure(request.isSecure())
                .sameSite("Lax")
                .path("/oidc")
                .maxAge(TTL_SECONDS)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    public Optional<OidcLoginTransaction> read(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return Optional.empty();
        }
        return Arrays.stream(request.getCookies())
                .filter(cookie -> COOKIE_NAME.equals(cookie.getName()))
                .map(Cookie::getValue)
                .map(this::verify)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .findFirst();
    }

    public void clear(HttpServletRequest request, HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(COOKIE_NAME, "")
                .httpOnly(true)
                .secure(request.isSecure())
                .sameSite("Lax")
                .path("/oidc")
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private String sign(OidcLoginTransaction transaction) {
        try {
            JWTClaimsSet claims = new JWTClaimsSet.Builder()
                    .claim("state", transaction.getState())
                    .claim("nonce", transaction.getNonce())
                    .claim("codeVerifier", transaction.getCodeVerifier())
                    .claim("redirectUri", transaction.getRedirectUri())
                    .claim("frontendRedirectUri", transaction.getFrontendRedirectUri())
                    .expirationTime(new Date(System.currentTimeMillis() + TTL_SECONDS * 1000))
                    .build();
            SignedJWT signedJWT = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
            signedJWT.sign(new MACSigner(tokenUtility.getSecret()));
            return signedJWT.serialize();
        } catch (Exception e) {
            throw new OidcLoginException("state_cookie_signing_failed", e);
        }
    }

    private Optional<OidcLoginTransaction> verify(String value) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(value);
            JWSVerifier verifier = new MACVerifier(tokenUtility.getSecret());
            if (!signedJWT.verify(verifier)) {
                return Optional.empty();
            }
            JWTClaimsSet claims = signedJWT.getJWTClaimsSet();
            if (claims.getExpirationTime() == null || claims.getExpirationTime().before(new Date())) {
                return Optional.empty();
            }
            return Optional.of(new OidcLoginTransaction(
                    claims.getStringClaim("state"),
                    claims.getStringClaim("nonce"),
                    claims.getStringClaim("codeVerifier"),
                    claims.getStringClaim("redirectUri"),
                    claims.getStringClaim("frontendRedirectUri")));
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}
