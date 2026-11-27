package io.opencelium.core.user;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import io.opencelium.core.tenant.TenantDocument;

/**
 * A user of one tenant, a tenant document; the username is unique per tenant, and so is the email
 * ({@link UserIndexes}). Holds the password hash in Spring Security's {@code {algorithm}hash} format, never the
 * password.
 *
 * @param email              the email of the user in lower case, or {@code null} when the user has none. The
 *                           constructor turns each email into lower case, so that each writer keeps it in the form
 *                           that a login compares without a difference between upper case and lower case.
 * @param mustChangePassword the password was generated for the user and must be replaced at the next login
 * @param passwordIssuedAt   when the current password was set; a generated one is locked 24 h later
 * @param temporary          an account that the caller marks as temporary; the application stores the flag
 *                           and does not act on it
 * @param locked             login refused, for example because a generated password expired
 * @param oidcLinks          the accounts at an IdP that log in as this user; none for a user that logs in with a
 *                           password only. A pair of issuer and subject is the link of 1 user of the tenant
 *                           ({@link UserIndexes}).
 */
@Document(UserDocument.COLLECTION)
public record UserDocument(@Id String id, String tenantId, String username, String email, String passwordHash,
		Set<String> roles, boolean mustChangePassword, Instant passwordIssuedAt, boolean temporary, boolean locked,
		Instant createdAt, List<OidcLink> oidcLinks) implements TenantDocument {

	/** The collection; {@link AdminLookup} reads it with the plain driver, and {@link UserRepository} queries it. */
	static final String COLLECTION = "users";

	static final String ID = "_id";

	static final String USERNAME = "username";

	static final String EMAIL = "email";

	static final String ROLES = "roles";

	static final String PASSWORD_HASH = "passwordHash";

	static final String MUST_CHANGE_PASSWORD = "mustChangePassword";

	static final String PASSWORD_ISSUED_AT = "passwordIssuedAt";

	static final String LOCKED = "locked";

	static final String OIDC_LINKS = "oidcLinks";

	/** The field of the issuer in an OIDC link, below {@link #OIDC_LINKS}. */
	static final String OIDC_ISSUER = "issuer";

	/** The field of the subject in an OIDC link, below {@link #OIDC_LINKS}. */
	static final String OIDC_SUBJECT = "subject";

	public UserDocument {
		email = lowerCaseEmail(email);
		roles = roles == null ? Set.of() : Set.copyOf(roles);
		oidcLinks = oidcLinks == null ? List.of() : List.copyOf(oidcLinks);
	}

	/** A user without an OIDC link. */
	public UserDocument(String id, String tenantId, String username, String email, String passwordHash,
			Set<String> roles, boolean mustChangePassword, Instant passwordIssuedAt, boolean temporary, boolean locked,
			Instant createdAt) {
		this(id, tenantId, username, email, passwordHash, roles, mustChangePassword, passwordIssuedAt, temporary,
				locked, createdAt, List.of());
	}

	/**
	 * The account of a person at an IdP: the claims {@code iss} and {@code sub} of its ID tokens.
	 *
	 * @param issuer  the issuer URL of the IdP
	 * @param subject the account of the person at the IdP
	 */
	public record OidcLink(String issuer, String subject) {

	}

	/**
	 * The form in which core keeps and compares an email. {@link Locale#ROOT}, so that the default locale of the JVM
	 * does not change the letters, for example the {@code I} in Turkish.
	 */
	static String lowerCaseEmail(String email) {
		return email == null ? null : email.toLowerCase(Locale.ROOT);
	}

	/** Without the password hash. */
	@Override
	public String toString() {
		return "UserDocument[id=" + id + ", tenant=" + tenantId + ", username=" + username + ", roles=" + roles
				+ ", mustChangePassword=" + mustChangePassword + ", temporary=" + temporary + ", locked=" + locked
				+ "]";
	}

}
