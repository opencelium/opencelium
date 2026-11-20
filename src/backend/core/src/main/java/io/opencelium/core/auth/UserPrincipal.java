package io.opencelium.core.auth;

import java.util.Objects;
import java.util.Set;

import org.springframework.security.core.AuthenticatedPrincipal;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.tenant.TenantPrincipal;

/**
 * The OpenCelium user of a session, as a valid token of the session names it: a session JWT, or a refresh token on
 * the endpoints of the refresh and the logout. The request filter of the tenant context reads the tenant of the
 * request from it. The roles are those of the session JWT, so a change of the roles of the user applies to the next
 * session JWT; a refresh token carries no roles, so its principal has none. The principal has no groups and no
 * permissions: the authorization uses the roles.
 *
 * @param userId    the ID of the OpenCelium user; also the name of the principal
 * @param tenantId  the tenant of the OpenCelium user
 * @param sessionId the ID of the session that the token belongs to
 * @param roles     the roles of the OpenCelium user in a session JWT; empty for a refresh token
 */
record UserPrincipal(String userId, TenantId tenantId, String sessionId, Set<String> roles)
		implements TenantPrincipal, AuthenticatedPrincipal {

	UserPrincipal {
		Objects.requireNonNull(userId, "userId");
		Objects.requireNonNull(tenantId, "tenantId");
		Objects.requireNonNull(sessionId, "sessionId");
		roles = roles == null ? Set.of() : Set.copyOf(roles);
	}

	@Override
	public String getName() {
		return userId;
	}

}
