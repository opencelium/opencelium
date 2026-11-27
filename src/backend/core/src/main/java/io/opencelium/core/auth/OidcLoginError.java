package io.opencelium.core.auth;

import java.net.URI;

/**
 * The errors of an OIDC login, at its start and at the answer of the IdP. The browser opened the endpoint, and the
 * frontend cannot read a response that core gives to the browser, so core redirects the browser to the login page of
 * the frontend with the error code after the {@code #}: the browser sends that part to no server. The target is a path
 * of the origin of core without a host, and nothing of the request changes it. The redirect has no body, and the target
 * holds no message text and no value of the request.
 */
enum OidcLoginError {

	/** No OIDC provider has the provider ID, or the deployment mode has no OIDC login strategy. */
	UNKNOWN_PROVIDER("unknown-provider"),

	/** The request has no hash of the login verifier, or the hash is not valid. */
	BAD_REQUEST("bad-request"),

	/** The IdP gives no discovery document. */
	IDP_ERROR("idp-error"),

	/** The answer of the IdP names no login record of the OIDC provider: a wrong state, a second or a late answer. */
	LOGIN_EXPIRED("login-expired"),

	/** The ID token has a wrong issuer, audience, signature or nonce, or it expired. */
	INVALID_ID_TOKEN("invalid-id-token");

	/** The login page of the frontend for an OIDC login. */
	static final String FRONTEND_PATH = "/login/oidc";

	private final String code;

	private final URI target;

	OidcLoginError(String code) {
		this.code = code;
		this.target = URI.create(FRONTEND_PATH + "#error=" + code);
	}

	String code() {
		return code;
	}

	/** The target of the redirect to the frontend. */
	URI target() {
		return target;
	}

}
