package io.opencelium.core.user;

import java.time.Instant;
import java.util.Set;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * A user of one tenant; the username is unique per tenant ({@link UserIndexes}). Holds the password hash in Spring
 * Security's {@code {algorithm}hash} format, never the password.
 *
 * @param mustChangePassword the password was generated for the user and must be replaced at the next login
 * @param passwordIssuedAt   when the current password was set; a generated one is locked 24 h later
 * @param temporary          a setup account to delete when setup completes (the cloud {@code operator})
 * @param locked             login refused, for example because a generated password expired
 */
@Document("users")
public record UserDocument(@Id String id, String tenantId, String username, String passwordHash, Set<String> roles,
		boolean mustChangePassword, Instant passwordIssuedAt, boolean temporary, boolean locked, Instant createdAt) {

	public UserDocument {
		roles = roles == null ? Set.of() : Set.copyOf(roles);
	}

	/** Without the password hash. */
	@Override
	public String toString() {
		return "UserDocument[id=" + id + ", tenant=" + tenantId + ", username=" + username + ", roles=" + roles
				+ ", mustChangePassword=" + mustChangePassword + ", temporary=" + temporary + ", locked=" + locked
				+ "]";
	}

}
