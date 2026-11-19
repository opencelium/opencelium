package io.opencelium.core.tenant;

/**
 * Work that needs a tenant runs without one: core started it outside the tenant runner. No default tenant takes the
 * place of the missing one, so that the data of 1 tenant cannot reach another tenant.
 */
public final class NoCurrentTenantException extends IllegalStateException {

	NoCurrentTenantException() {
		super("No current tenant: this work does not run through the tenant runner. Run it with the tenant of its"
				+ " request or of the record that starts it.");
	}

}
