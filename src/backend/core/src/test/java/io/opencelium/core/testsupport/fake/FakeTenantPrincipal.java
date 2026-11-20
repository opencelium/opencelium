package io.opencelium.core.testsupport.fake;

import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.tenant.TenantPrincipal;

/**
 * The principal of a login that gives a tenant, for the tests of the current tenant. A login strategy gives such a
 * principal to Spring Security; a test gives it to a request with
 * {@code SecurityMockMvcRequestPostProcessors.authentication(FakeTenantPrincipal.loggedIn(tenant))}.
 */
public record FakeTenantPrincipal(TenantId tenantId) implements TenantPrincipal {

	/** The authentication of a user of {@code tenant} after the login. */
	public static Authentication loggedIn(TenantId tenant) {
		return UsernamePasswordAuthenticationToken.authenticated(new FakeTenantPrincipal(tenant), null, List.of());
	}

}
