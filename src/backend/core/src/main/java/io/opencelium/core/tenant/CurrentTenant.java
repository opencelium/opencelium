package io.opencelium.core.tenant;

import org.springframework.stereotype.Component;

import io.opencelium.common.tenant.TenantId;

/**
 * The tenant for which the work of this thread runs. Only {@link TenantRunner} binds it, for the time of 1 task. A
 * scoped value holds it, so a thread of a pool cannot keep it for its next task, and code inside the task cannot
 * change it. A read has no mode logic: in the self-host mode the tenant runner binds the 1 tenant of the installation
 * on the same path as it binds a tenant of the cloud mode.
 */
@Component
public final class CurrentTenant {

	/**
	 * @throws NoCurrentTenantException when the work of this thread does not run through the tenant runner
	 */
	public TenantId get() {
		throw new UnsupportedOperationException("not implemented yet");
	}

}
