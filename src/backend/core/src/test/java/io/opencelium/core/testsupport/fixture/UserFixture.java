package io.opencelium.core.testsupport.fixture;

import java.time.Instant;
import java.util.Set;

import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.tenant.TenantDocuments;
import io.opencelium.core.tenant.TenantRunner;
import io.opencelium.core.testsupport.TenantTasks;
import io.opencelium.core.user.UserDocument;

/**
 * An OpenCelium user of the self-host tenant for a test of the login: a username and a password, and as options an
 * email, a lock, or a generated password that the user must change. {@link #storeIn} stores the user through the
 * tenant runner and the tenant-document access, as core stores a user. The password hash has the format of core, so
 * the local login strategy compares the password with it. The user has no role.
 */
public final class UserFixture {

	private static final PasswordEncoder PASSWORD_ENCODER = PasswordEncoderFactories.createDelegatingPasswordEncoder();

	private final String username;

	private final String password;

	private String email;

	private boolean locked;

	private boolean generatedPassword;

	private UserFixture(String username, String password) {
		this.username = username;
		this.password = password;
	}

	/** A user that is not locked, with no email and with a password that the user chose. */
	public static UserFixture aUser(String username, String password) {
		return new UserFixture(username, password);
	}

	/** The email as the test gives it; the user document decides how core keeps it. */
	public UserFixture withEmail(String email) {
		this.email = email;
		return this;
	}

	/** A user that cannot start a session. */
	public UserFixture locked() {
		this.locked = true;
		return this;
	}

	/** A password that core generated, issued now: the user must change it, and it is not old enough for a lock. */
	public UserFixture withAGeneratedPassword() {
		this.generatedPassword = true;
		return this;
	}

	/** @return the stored user, with the ID that the database gave it */
	public UserDocument storeIn(TenantRunner tenantRunner, TenantDocuments documents) {
		Instant now = Instant.now();
		var user = new UserDocument(null, TenantId.SELF_HOST.value(), username, email,
				PASSWORD_ENCODER.encode(password), Set.of(), generatedPassword, now, false, locked, now);
		return TenantTasks.call(tenantRunner, TenantId.SELF_HOST, () -> documents.insert(user));
	}

}
