package io.opencelium.core.authz;

/**
 * The roles of an OpenCelium user, and the authority that the authentication gives Spring Security for each role.
 * The access control owns them, so the access control depends on no feature, and the users and the authentication
 * read the roles from here.
 */
public final class Roles {

	/** The role of an admin of the installation. */
	public static final String ADMIN = "ADMIN";

	/** The prefix of the authority of a role, as the role checks of Spring Security expect it. */
	private static final String AUTHORITY_PREFIX = "ROLE_";

	private Roles() {
	}

	/** The authority that a login with the role has, for example {@code ROLE_ADMIN} for {@link #ADMIN}. */
	public static String authorityOf(String role) {
		return AUTHORITY_PREFIX + role;
	}

}
