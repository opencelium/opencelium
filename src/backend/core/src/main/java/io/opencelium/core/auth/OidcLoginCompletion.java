package io.opencelium.core.auth;

import org.springframework.stereotype.Service;

/**
 * Completes an OIDC login at the answer of the IdP: it reads and deletes the login record of the state, gets the ID
 * token for the code of the IdP and checks it, finds or makes the OpenCelium user of the ID token, starts a session
 * and issues its login code. A refused answer starts no session.
 */
@Service
class OidcLoginCompletion {

	/**
	 * @param providerId  the provider ID of the path of the redirect URI
	 * @param state       the state of the answer, or {@code null} when the answer has none
	 * @param code        the code of the IdP, or {@code null} when the answer has none
	 * @param error       the error code of the IdP, or {@code null} when the answer has none
	 * @param redirectUri the redirect URI at which the IdP answered, for the token request
	 * @return the login code of the new session, or the error that refuses the answer
	 */
	OidcLoginOutcome complete(String providerId, String state, String code, String error, String redirectUri) {
		throw new UnsupportedOperationException("Not implemented yet.");
	}

}
