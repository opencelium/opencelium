package io.opencelium.core.tenant;

import java.security.Principal;
import java.util.Optional;

import org.springframework.security.core.Authentication;

import io.opencelium.common.tenant.TenantId;

/**
 * The principal of a login names the tenant of its user. A login strategy puts a principal with this contract into
 * the authentication that it gives Spring Security. The request filter, and the gateway of the WebSocket sessions,
 * read the current tenant through {@link #tenantOf} and from nothing else: no header, no parameter and no body.
 */
public interface TenantPrincipal {

	/** The 1 tenant of the user of this login. */
	TenantId tenantId();

	/**
	 * The tenant of the login of a request or of a WebSocket session. Both give the authentication of Spring Security
	 * as their user principal; a session keeps the one of the request of its handshake.
	 *
	 * @param userPrincipal the user principal of the request or the session; {@code null} when nobody is logged in
	 * @return empty when nobody is logged in, when the authentication is not complete, or when its principal names no
	 *         tenant
	 */
	static Optional<TenantId> tenantOf(Principal userPrincipal) {
		if (userPrincipal instanceof Authentication login && login.isAuthenticated()
				&& login.getPrincipal() instanceof TenantPrincipal principal) {
			return Optional.of(principal.tenantId());
		}
		return Optional.empty();
	}

}
