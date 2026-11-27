package io.opencelium.core.auth;

import org.springframework.security.oauth2.jwt.Jwt;

/**
 * The 2 tokens that core issues for a session, at a login, at the exchange of a login code, and at each refresh.
 *
 * @param sessionJwt   the session JWT, for each request to a protected endpoint
 * @param refreshToken the refresh token, to refresh the session or to end it
 */
record IssuedTokens(Jwt sessionJwt, Jwt refreshToken) {
}
