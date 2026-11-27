package io.opencelium.core.auth;

import java.time.Duration;
import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import io.opencelium.core.tenant.TenantDocument;

/**
 * The state of 1 OIDC login that the browser started and the IdP has not answered yet, a tenant document of the
 * tenant of the login. It holds what core must find again when the IdP answers: the state that names the record, the
 * nonce that the ID token must have, the PKCE verifier for the token request, and the hash of the login verifier that
 * the HTTP client gave at the start. It holds no client secret, no token and no code of the IdP, and the PKCE verifier
 * gives no access without them. MongoDB removes a record after its end ({@link OidcLoginIndexes}).
 *
 * @param id                the ID that the database gives the record
 * @param providerId        the provider ID of the OIDC provider whose login page the browser got; the IdP answers at
 *                          the redirect URI of that OIDC provider only
 * @param state             the state of the authorization request
 * @param nonce             the nonce of the authorization request
 * @param codeVerifier      the PKCE verifier of the authorization request
 * @param loginVerifierHash the SHA-256 hash of the login verifier of the HTTP client, in the base64url form
 * @param expiresAt         the end of the login: 10 minutes after the start
 */
@Document(OidcLoginRecord.COLLECTION)
record OidcLoginRecord(@Id String id, String tenantId, String providerId, String state, String nonce,
		String codeVerifier, String loginVerifierHash, Instant expiresAt) implements TenantDocument {

	static final String COLLECTION = "oidc_logins";

	static final String STATE = "state";

	static final String PROVIDER_ID = "providerId";

	static final String EXPIRES_AT = "expiresAt";

	/** The time from the start of a login to its end; a fixed value of the code. */
	static final Duration LIFE = Duration.ofMinutes(10);

}
