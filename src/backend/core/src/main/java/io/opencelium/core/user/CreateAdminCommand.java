package io.opencelium.core.user;

import java.util.Objects;

import io.opencelium.common.tenant.TenantId;

/**
 * Input for {@link UserService#createAdmin}. The service zeroes {@code password} once it is hashed.
 *
 * @param generated the password was generated, not typed: it must be changed at the first login and is locked after
 *                  24 h
 * @param temporary an account that the caller marks as temporary; the application stores the flag and does
 *                  not act on it
 */
public record CreateAdminCommand(TenantId tenantId, String username, char[] password, boolean generated,
		boolean temporary) {

	public CreateAdminCommand {
		Objects.requireNonNull(tenantId, "tenantId");
		Objects.requireNonNull(username, "username");
		Objects.requireNonNull(password, "password");
		if (username.isBlank()) {
			throw new IllegalArgumentException("The username must not be blank.");
		}
		if (password.length == 0) {
			throw new IllegalArgumentException("The password must not be empty.");
		}
	}

	/** Without the password. */
	@Override
	public String toString() {
		return "CreateAdminCommand[tenant=" + tenantId + ", username=" + username + ", password=****, generated="
				+ generated + ", temporary=" + temporary + "]";
	}

}
