package io.opencelium.core.testsupport;

import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Supplier;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.tenant.TenantRunner;

/**
 * Runs a step of a test through the tenant runner, as core runs a request or a background task, and gives its result
 * back. A step that reads or writes tenant documents needs it: without a current tenant the step stops.
 */
public final class TenantTasks {

	private TenantTasks() {
	}

	public static <T> T call(TenantRunner runner, TenantId tenant, Supplier<T> step) {
		var result = new AtomicReference<T>();
		runner.run(tenant, () -> result.set(step.get()));
		return result.get();
	}

}
