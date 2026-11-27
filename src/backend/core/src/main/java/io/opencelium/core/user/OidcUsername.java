package io.opencelium.core.user;

import java.util.function.Predicate;

/**
 * The username of a new OpenCelium user of an OIDC login: the email of the ID token when the IdP verified it, else the
 * provider ID, a hyphen and the subject. When an OpenCelium user of the tenant has that username already, the new one
 * gets a hyphen and a number after it, so that the username stays unique.
 */
final class OidcUsername {

	private static final String SEPARATOR = "-";

	private OidcUsername() {
	}

	/**
	 * @param providerId    the provider ID of the OIDC provider of the login
	 * @param subject       the claim {@code sub} of the ID token
	 * @param email         the claim {@code email} of the ID token, or {@code null} when it has none
	 * @param emailVerified the claim {@code email_verified} of the ID token
	 * @param taken         tells whether an OpenCelium user of the tenant has a username
	 * @return a username that no OpenCelium user of the tenant has
	 */
	static String of(String providerId, String subject, String email, boolean emailVerified,
			Predicate<String> taken) {
		String base = emailVerified && email != null && !email.isBlank() ? email : providerId + SEPARATOR + subject;
		String username = base;
		for (int number = 1; taken.test(username); number++) {
			username = base + SEPARATOR + number;
		}
		return username;
	}

}
