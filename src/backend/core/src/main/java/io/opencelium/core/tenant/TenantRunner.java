package io.opencelium.core.tenant;

import java.util.Objects;
import java.util.Optional;

import org.slf4j.MDC;
import org.springframework.stereotype.Component;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.config.DeploymentMode;
import io.opencelium.core.config.OpenCeliumProperties;

/**
 * Runs 1 task for 1 tenant. It binds the tenant as the {@link CurrentTenant} of the task and puts its ID into the MDC
 * key {@value #MDC_KEY}, so that each log line of the task names the tenant. The 2 end with the task, also when the
 * task fails. A request and a background task get their tenant only through this class; a background task gives the
 * tenant of the record that starts it and runs with nobody logged in.
 * <p>
 * It starts no task, and throws, for a tenant that the deployment mode does not permit:
 * <ul>
 * <li>self-host: each tenant other than {@link TenantId#SELF_HOST}, the 1 tenant of the installation;</li>
 * <li>cloud: a reserved tenant. The self-host tenant is not a customer, and {@link TenantId#SYSTEM} is the data of the
 * installation itself, which belongs to no tenant;</li>
 * <li>both modes: a tenant other than the one that the thread runs already, so that 1 task cannot reach the data of
 * 2 tenants.</li>
 * </ul>
 */
@Component
public final class TenantRunner {

	/** The MDC key of the bound tenant. The default log pattern prints it; an own pattern prints it with %X{tenant}. */
	public static final String MDC_KEY = "tenant";

	private final DeploymentMode mode;

	TenantRunner(OpenCeliumProperties properties) {
		this.mode = properties.deploymentMode();
	}

	/**
	 * @throws IllegalArgumentException when the deployment mode does not permit {@code tenant}
	 * @throws IllegalStateException    when the thread runs a task of another tenant already
	 */
	public void run(TenantId tenant, Runnable task) {
		Objects.requireNonNull(tenant, "tenant");
		Objects.requireNonNull(task, "task");
		checkPermittedInThisMode(tenant);
		if (CurrentTenant.BOUND.isBound() && !CurrentTenant.BOUND.get().equals(tenant)) {
			throw new IllegalStateException("Cannot run a task for the tenant '" + tenant + "' inside the task of the"
					+ " tenant '" + CurrentTenant.BOUND.get() + "'.");
		}
		// A task of the same tenant can run inside this one: the outer task gets its MDC value back afterwards.
		String outerValue = MDC.get(MDC_KEY);
		MDC.put(MDC_KEY, tenant.value());
		try {
			ScopedValue.where(CurrentTenant.BOUND, tenant).run(task);
		}
		finally {
			if (outerValue == null) {
				MDC.remove(MDC_KEY);
			}
			else {
				MDC.put(MDC_KEY, outerValue);
			}
		}
	}

	/** A switch expression, so that a new deployment mode does not compile before it has its own rule. */
	private void checkPermittedInThisMode(TenantId tenant) {
		Optional<String> refusal = switch (mode) {
			case SELF_HOST -> tenant.equals(TenantId.SELF_HOST) ? Optional.empty()
					: Optional.of("only the tenant '" + TenantId.SELF_HOST + "' runs work");
			case CLOUD -> tenant.isReserved() ? Optional.of("no work runs for a reserved tenant") : Optional.empty();
		};
		refusal.ifPresent(reason -> {
			throw new IllegalArgumentException("Cannot run a task for the tenant '" + tenant + "': in the "
					+ mode.propertyValue() + " mode " + reason + ".");
		});
	}

}
