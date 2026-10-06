package io.opencelium.core.user;

import io.opencelium.common.tenant.TenantId;

/** {@link UserService#createAdmin} was called for a tenant that already has an admin. */
public final class AdminAlreadyExistsException extends RuntimeException {

	AdminAlreadyExistsException(TenantId tenant) {
		super("Tenant " + tenant + " already has an admin user.");
	}

}
