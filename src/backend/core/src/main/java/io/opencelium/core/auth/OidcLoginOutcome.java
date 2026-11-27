package io.opencelium.core.auth;

/**
 * The end of an OIDC login at the answer of the IdP: a login code for the new session, or the error that refuses the
 * answer. The endpoint of the answer redirects the browser to the frontend with one of them.
 */
sealed interface OidcLoginOutcome {

	/**
	 * Core started a session for the OpenCelium user of the ID token.
	 *
	 * @param loginCode the login code of the new session, which the HTTP client exchanges for the 2 tokens
	 */
	record LoginCode(String loginCode) implements OidcLoginOutcome {

	}

	/**
	 * Core refused the answer of the IdP and started no session.
	 *
	 * @param error the error code for the frontend
	 */
	record Refused(OidcLoginError error) implements OidcLoginOutcome {

	}

}
