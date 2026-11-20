package io.opencelium.core.tenant;

import org.springframework.core.task.TaskDecorator;
import org.springframework.stereotype.Component;

import io.opencelium.common.tenant.TenantId;

/**
 * Carries the current tenant of the caller to a task that runs on another thread. A thread of a pool does not see the
 * tenant of the caller, so the decorator reads it when core gives the task to the executor, and the task runs through
 * the tenant runner for that tenant. A caller without a tenant gives the task none.
 * <p>
 * Spring Boot applies this bean to the application task executor and to the task scheduler. A thread that core starts
 * in another way has no tenant, and each use of a tenant document on it stops.
 */
@Component
final class TenantTaskDecorator implements TaskDecorator {

	private final TenantRunner tenantRunner;

	TenantTaskDecorator(TenantRunner tenantRunner) {
		this.tenantRunner = tenantRunner;
	}

	@Override
	public Runnable decorate(Runnable task) {
		if (!CurrentTenant.BOUND.isBound()) {
			return task;
		}
		TenantId tenant = CurrentTenant.BOUND.get();
		return () -> tenantRunner.run(tenant, task);
	}

}
