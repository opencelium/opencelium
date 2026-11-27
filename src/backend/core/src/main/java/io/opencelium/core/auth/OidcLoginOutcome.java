package io.opencelium.core.auth;

import java.net.URI;

/**
 * The end of an OIDC login at the answer of the IdP: a login code for the new session, or the error that refuses the
 * answer. The endpoint of the answer redirects the browser to the frontend with one of them.
 */
sealed interface OidcLoginOutcome {

	/**
	 * The target of the redirect to the frontend: the login page of the frontend, a path of the origin of core without
	 * a host, with the login code or the error code after the {@code #}. The browser sends that part to no server.
	 */
	URI target();

	/**
	 * Core started a session for the OpenCelium user of the ID token.
	 *
	 * @param loginCode the login code of the new session, which the HTTP client exchanges for the 2 tokens
	 */
	record LoginCode(String loginCode) implements OidcLoginOutcome {

		private static final String CODE_PARAMETER = "#code=";

		/** The login code is made of the characters of a signed token, which a URL holds without an escape. */
		@Override
		public URI target() {
			return URI.create(OidcLoginError.FRONTEND_PATH + CODE_PARAMETER + loginCode);
		}

		/** Without the login code: it gives access to the session. */
		@Override
		public String toString() {
			return "LoginCode[loginCode=****]";
		}

	}

	/**
	 * Core refused the answer of the IdP and started no session.
	 *
	 * @param error the error code for the frontend
	 */
	record Refused(OidcLoginError error) implements OidcLoginOutcome {

		@Override
		public URI target() {
			return error.target();
		}

	}

}
