package io.opencelium.core.user;

import java.nio.CharBuffer;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.Set;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.auth.oidc.OidcIdentity;
import io.opencelium.core.authz.Roles;
import io.opencelium.core.tenant.CurrentTenant;
import io.opencelium.core.tenant.NoCurrentTenantException;

/**
 * Creates users and changes their passwords, and finds or creates the user of an OIDC login, which it refuses when the
 * user is locked or the email of a new user belongs to another user. Each operation works on the users of the current
 * tenant and stops with {@link NoCurrentTenantException} without one; no operation takes a tenant as a parameter.
 * Passwords arrive as {@code char[]} and are zeroed once hashed, also when the call fails; they are never logged or
 * returned. The login is not part of this service: it reads a user with {@link #findByUsername} or
 * {@link #findByEmail} and compares the password itself.
 */
@Service
public class UserService {

	public static final String ADMIN_ROLE = Roles.ADMIN;

	/** How long a generated password may stay unchanged before the user is locked. */
	static final Duration GENERATED_PASSWORD_LIFETIME = Duration.ofHours(24);

	/**
	 * How often the lookup of an OIDC user is tried again when another login changed the users after a read of the
	 * lookup, for example it took the username. Each try reads the users again, so a second failure needs yet another
	 * login that changed them in between.
	 */
	private static final int OIDC_USER_ATTEMPTS = 3;

	private static final Log log = LogFactory.getLog(UserService.class);

	private final UserRepository users;

	private final CurrentTenant currentTenant;

	private final PasswordEncoder passwordEncoder;

	private final Clock clock;

	UserService(UserRepository users, CurrentTenant currentTenant, PasswordEncoder passwordEncoder, Clock clock) {
		this.users = users;
		this.currentTenant = currentTenant;
		this.passwordEncoder = passwordEncoder;
		this.clock = clock;
	}

	/**
	 * Creates the first admin of the current tenant.
	 *
	 * @throws AdminAlreadyExistsException when the tenant has an admin, so a repeated setup cannot add a second one
	 */
	public UserCreated createAdmin(CreateAdminCommand command) {
		try {
			TenantId tenant = currentTenant.get();
			if (adminExists()) {
				throw new AdminAlreadyExistsException(tenant);
			}
			String hash = passwordEncoder.encode(CharBuffer.wrap(command.password()));
			Instant now = clock.instant();
			UserDocument user = users.insert(new UserDocument(null, tenant.value(), command.username(), null, hash,
					Set.of(ADMIN_ROLE), command.generated(), now, command.temporary(), false, now));
			return new UserCreated(user.id(), user.username());
		}
		finally {
			Arrays.fill(command.password(), '\0');
		}
	}

	/**
	 * Replaces the password with one the user chose: no change is required any more, and a locked user is unlocked.
	 *
	 * @throws NoSuchElementException when no user of the current tenant has this id
	 */
	public void changePassword(String userId, char[] newPassword) {
		try {
			String hash = passwordEncoder.encode(CharBuffer.wrap(newPassword));
			if (users.setChosenPassword(userId, hash, clock.instant()) == 0) {
				throw new NoSuchElementException("No user with id " + userId + ".");
			}
		}
		finally {
			Arrays.fill(newPassword, '\0');
		}
	}

	/**
	 * The user of the current tenant with exactly this username: {@code Admin} does not find the user {@code admin}.
	 * The user holds the password hash, for the comparison of a login.
	 */
	public Optional<UserDocument> findByUsername(String username) {
		return users.findByUsername(username);
	}

	/**
	 * The user of the current tenant with this email, compared without a difference between upper case and lower case:
	 * {@code Alice@Example.com} finds the user with the email {@code alice@example.com}. The user holds the password
	 * hash, for the comparison of a login.
	 */
	public Optional<UserDocument> findByEmail(String email) {
		return users.findByEmail(UserDocument.lowerCaseEmail(email));
	}

	/** The user of the current tenant with this ID. */
	public Optional<UserDocument> findById(String id) {
		return users.findById(id);
	}

	/**
	 * The OpenCelium user of the correct ID token of an OIDC login, in the current tenant, for an OIDC provider without
	 * the email-link option:
	 * <ol>
	 * <li>The user with the OIDC link of the issuer and the subject of the ID token.</li>
	 * <li>Else a new user with that OIDC link: it has no role and no password, so only the OIDC login of the link logs
	 * it in. Its username comes from {@link OidcUsername}. It gets the email of the ID token only when the IdP verified
	 * it.</li>
	 * </ol>
	 * The unique index of the OIDC link refuses a second user for the link, so of 2 logins of the same account that
	 * make a user at the same time, both get the user that was stored first. A user that the lookup finds must not be
	 * locked. Core changes no user when it refuses.
	 *
	 * @param providerId the provider ID of the OIDC provider of the login, for the username
	 * @param identity   the claims of the checked ID token
	 * @throws UserLockedException   when the user with the OIDC link is locked
	 * @throws EmailTakenException   when the new user needs the verified email of the ID token and another user has it,
	 *                               compared without a difference between upper case and lower case
	 * @throws IllegalStateException when the logins that run at the same time change the users on each attempt, so that
	 *                               the lookup finds no user and makes none
	 */
	public UserDocument findOrCreateByOidcLink(String providerId, OidcIdentity identity) {
		return findOrCreateByOidc(providerId, identity, false);
	}

	/**
	 * The OpenCelium user of the correct ID token of an OIDC login, in the current tenant, for an OIDC provider with the
	 * email-link option. The rules are those of {@link #findOrCreateByOidcLink}, with this rule between them: when the
	 * IdP verified the email of the ID token, the user with that email, compared without a difference between upper case
	 * and lower case, is the user of the login. It gets the OIDC link, so that the next login of the account finds it by
	 * the link, and a link that it has already stays. A user with the role ADMIN is such a user too.
	 * <p>
	 * The link is added by 1 conditional update, so that a user locked after the lookup, or with another email after
	 * the lookup, does not get it.
	 *
	 * @param providerId the provider ID of the OIDC provider of the login, for the username
	 * @param identity   the claims of the checked ID token
	 * @throws UserLockedException   when the user with the OIDC link, or the user with the email, is locked
	 * @throws IllegalStateException when the logins that run at the same time change the users on each attempt, so that
	 *                               the lookup finds no user and makes none
	 */
	public UserDocument findOrCreateByOidcLinkOrEmail(String providerId, OidcIdentity identity) {
		return findOrCreateByOidc(providerId, identity, true);
	}

	private UserDocument findOrCreateByOidc(String providerId, OidcIdentity identity, boolean emailLink) {
		String email = identity.emailVerified() && identity.email() != null && !identity.email().isBlank()
				? UserDocument.lowerCaseEmail(identity.email()) : null;
		for (int attempt = 0; attempt < OIDC_USER_ATTEMPTS; attempt++) {
			Optional<UserDocument> user = findOrCreateByOidcOnce(providerId, identity, email, emailLink);
			if (user.isPresent()) {
				return user.get();
			}
		}
		throw new IllegalStateException("No OpenCelium user for a login of the OIDC provider " + providerId + " after "
				+ OIDC_USER_ATTEMPTS + " attempts.");
	}

	/**
	 * 1 attempt of the lookup, which reads the users again.
	 *
	 * @param email the verified email of the ID token in lower case, or {@code null} when it has none
	 * @return the user, or nothing when a login that runs at the same time changed the users after a read of this
	 *         attempt
	 */
	private Optional<UserDocument> findOrCreateByOidcOnce(String providerId, OidcIdentity identity, String email,
			boolean emailLink) {
		Optional<UserDocument> linked = users.findByOidcLink(identity.issuer(), identity.subject());
		if (linked.isPresent()) {
			return Optional.of(requireUnlocked(linked.get()));
		}
		var link = new UserDocument.OidcLink(identity.issuer(), identity.subject());
		Optional<UserDocument> withEmail = email == null ? Optional.empty() : users.findByEmail(email);
		if (withEmail.isPresent()) {
			if (!emailLink) {
				throw new EmailTakenException();
			}
			return addOidcLink(requireUnlocked(withEmail.get()), email, link);
		}
		String username = OidcUsername.of(providerId, identity.subject(), identity.email(), identity.emailVerified(),
				name -> users.findByUsername(name).isPresent());
		try {
			return Optional.of(users.insert(new UserDocument(null, currentTenant.get().value(), username, email, null,
					Set.of(), false, null, false, false, clock.instant(), List.of(link))));
		}
		catch (DuplicateKeyException ex) {
			// An index refused the user: the person has a user already, another login took the username or the email
			// after the check, or another login made the user of the OIDC link. The next attempt finds out which.
			return Optional.empty();
		}
	}

	/**
	 * @param email the verified email of the ID token in lower case, which the user must still have at the write
	 * @return the user with the OIDC link, or nothing when the user was locked, deleted or given another email since the
	 *         read, or another user got the link since the read: the next attempt finds out which
	 */
	private Optional<UserDocument> addOidcLink(UserDocument user, String email, UserDocument.OidcLink link) {
		try {
			if (users.addOidcLinkIfUnlocked(user.id(), email, link) == 0) {
				return Optional.empty();
			}
		}
		catch (DuplicateKeyException ex) {
			return Optional.empty();
		}
		return users.findById(user.id());
	}

	private static UserDocument requireUnlocked(UserDocument user) {
		if (user.locked()) {
			throw new UserLockedException();
		}
		return user;
	}

	/** Whether the current tenant has an admin. */
	public boolean adminExists() {
		return users.existsWithRole(ADMIN_ROLE);
	}

	/** Whether the current tenant has a user of any role. */
	public boolean anyUserExists() {
		return users.existsAny();
	}

	/**
	 * Locks every user of the current tenant whose generated password is older than 24 h and still unchanged.
	 *
	 * @return the number of users locked by this call
	 */
	public int lockExpiredGeneratedPasswords() {
		Instant cutoff = clock.instant().minus(GENERATED_PASSWORD_LIFETIME);
		int locked = 0;
		for (UserDocument user : users.findAllGeneratedUnchangedBefore(cutoff)) {
			// Conditional: a password changed since the query is not locked.
			if (users.lockIfGeneratedUnchangedBefore(user.id(), cutoff) == 1) {
				locked++;
				log.info("Locked user '" + user.username() + "' of tenant " + user.tenantId()
						+ ": its generated password was not changed within " + GENERATED_PASSWORD_LIFETIME.toHours()
						+ " h");
			}
		}
		return locked;
	}

}
