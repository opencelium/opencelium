package io.opencelium.core.auth;

import java.util.Set;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.tenant.TenantPrincipal;

/**
 * The OpenCelium user of a session, as a valid session JWT names it. The request filter of the tenant context reads
 * the tenant of the request from it. The roles are those of the session JWT, so a change of the roles of the user
 * applies to the next session JWT. The principal has no groups and no permissions: the authorization uses the roles.
 *
 * @param userId    the ID of the OpenCelium user
 * @param tenantId  the tenant of the OpenCelium user
 * @param sessionId the ID of the session that the session JWT belongs to
 * @param roles     the roles of the OpenCelium user
 */
record UserPrincipal(String userId, TenantId tenantId, String sessionId, Set<String> roles)
		implements TenantPrincipal {

}
