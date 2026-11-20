package io.opencelium.core.auth;

import java.util.Collection;
import java.util.List;
import java.util.Set;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.user.UserDocument;

/**
 * The OpenCelium user of a login, as the local login strategy compares the password with it. After a successful login
 * the session starts for this user. It has no authorities: the permissions are not part of the authentication.
 *
 * @param passwordHash the password hash of the user, never the password; {@link #toString()} does not show it
 * @param locked       a locked user starts no session
 */
record LoginUser(String userId, TenantId tenantId, String username, String passwordHash, Set<String> roles,
		boolean locked) implements UserDetails {

	LoginUser {
		roles = roles == null ? Set.of() : Set.copyOf(roles);
	}

	static LoginUser of(UserDocument user) {
		return new LoginUser(user.id(), TenantId.of(user.tenantId()), user.username(), user.passwordHash(), user.roles(),
				user.locked());
	}

	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		return List.of();
	}

	@Override
	public String getPassword() {
		return passwordHash;
	}

	@Override
	public String getUsername() {
		return username;
	}

	@Override
	public boolean isAccountNonLocked() {
		return !locked;
	}

	/** Without the password hash. */
	@Override
	public String toString() {
		return "LoginUser[userId=" + userId + ", tenant=" + tenantId + ", username=" + username + ", roles=" + roles
				+ ", locked=" + locked + "]";
	}

}
