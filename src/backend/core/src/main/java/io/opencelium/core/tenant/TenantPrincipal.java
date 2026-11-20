package io.opencelium.core.tenant;

import java.security.Principal;
import java.util.Optional;

import io.opencelium.common.tenant.TenantId;

public interface TenantPrincipal {

	TenantId tenantId();

	static Optional<TenantId> tenantOf(Principal userPrincipal) {
		throw new UnsupportedOperationException("not implemented");
	}

}
