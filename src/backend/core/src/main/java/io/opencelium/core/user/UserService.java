package io.opencelium.core.user;

import java.nio.CharBuffer;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.NoSuchElementException;
import java.util.Set;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import io.opencelium.common.tenant.TenantId;

/**
 * Creates users and changes their passwords. Passwords arrive as {@code char[]} and are zeroed once hashed, also when
 * the call fails; they are never logged or returned. Login is OC-1585.
 */
@Service
public class UserService {

	public static final String ADMIN_ROLE = "ADMIN";

	/** How long a generated password may stay unchanged before the user is locked. */
	static final Duration GENERATED_PASSWORD_LIFETIME = Duration.ofHours(24);

	private static final Log log = LogFactory.getLog(UserService.class);

	private final UserRepository users;

	private final PasswordEncoder passwordEncoder;

	private final Clock clock;

	UserService(UserRepository users, PasswordEncoder passwordEncoder, Clock clock) {
		this.users = users;
		this.passwordEncoder = passwordEncoder;
		this.clock = clock;
	}

	/**
	 * Creates the first admin of a tenant.
	 *
	 * @throws AdminAlreadyExistsException when the tenant has an admin, so a repeated setup cannot add a second one
	 */
	public UserCreated createAdmin(CreateAdminCommand command) {
		try {
			if (adminExists(command.tenantId())) {
				throw new AdminAlreadyExistsException(command.tenantId());
			}
			String hash = passwordEncoder.encode(CharBuffer.wrap(command.password()));
			Instant now = clock.instant();
			UserDocument user = users.insert(new UserDocument(null, command.tenantId().value(), command.username(),
					hash, Set.of(ADMIN_ROLE), command.generated(), now, command.temporary(), false, now));
			return new UserCreated(user.id(), user.username());
		}
		finally {
			Arrays.fill(command.password(), '\0');
		}
	}

	/**
	 * Replaces the password with one the user chose: no change is required any more, and a locked user is unlocked.
	 *
	 * @throws NoSuchElementException when no user has this id
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

	public boolean adminExists(TenantId tenant) {
		return users.existsByTenantIdAndRolesContaining(tenant.value(), ADMIN_ROLE);
	}

	/**
	 * Locks every user whose generated password is older than 24 h and still unchanged.
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
