package io.opencelium.core.auth;

import java.time.Instant;

/**
 * The response of a login, of a refresh and of the exchange of a login code: the 2 tokens of the session and their
 * expiry, in UTC.
 *
 * @param sessionJwtExpiresAt   the claim {@code exp} of the session JWT
 * @param refreshTokenExpiresAt the claim {@code exp} of the refresh token
 */
record TokenResponse(String sessionJwt, Instant sessionJwtExpiresAt, String refreshToken,
		Instant refreshTokenExpiresAt) {

	static TokenResponse of(IssuedTokens tokens) {
		return new TokenResponse(tokens.sessionJwt().getTokenValue(), tokens.sessionJwt().getExpiresAt(),
				tokens.refreshToken().getTokenValue(), tokens.refreshToken().getExpiresAt());
	}

	/** Without the tokens. */
	@Override
	public String toString() {
		return "TokenResponse[sessionJwt=****, sessionJwtExpiresAt=" + sessionJwtExpiresAt + ", refreshToken=****,"
				+ " refreshTokenExpiresAt=" + refreshTokenExpiresAt + "]";
	}

}
