package io.opencelium.core.tenant;

import java.nio.file.Path;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.config.DeploymentMode;
import io.opencelium.core.config.OpenCeliumProperties;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The task decorator carries the tenant of the caller to a task on another thread: the task reads it as the current
 * tenant and finds it in the MDC key {@code tenant}. A caller without a tenant gives none to the task.
 */
class TenantTaskDecoratorTest {

	private static final TenantId ACME = TenantId.of("acme");

	private final TenantRunner runner = new TenantRunner(
			new OpenCeliumProperties(DeploymentMode.CLOUD, Path.of("data"), Optional.empty()));

	private final TenantTaskDecorator decorator = new TenantTaskDecorator(runner);

	private final CurrentTenant currentTenant = new CurrentTenant();

	private final AtomicReference<Seen> seen = new AtomicReference<>();

	@AfterEach
	void noTenantStaysInTheLog() {
		MDC.clear();
	}

	@Test
	void decorateCarriesTheBoundTenantWhenTheTaskRunsOnAnotherThread() throws InterruptedException {
		var decorated = new AtomicReference<Runnable>();
		runner.run(ACME, () -> decorated.set(decorator.decorate(this::recordWhatTheTaskSees)));

		runOnAnotherThread(decorated.get());

		assertThat(seen.get().thread()).isNotSameAs(Thread.currentThread());
		assertThat(seen.get().tenant()).contains(ACME);
		assertThat(seen.get().logged()).isEqualTo("acme");
	}

	@Test
	void decorateBindsNoTenantWhenTheCallerHasNone() throws InterruptedException {
		Runnable decorated = decorator.decorate(this::recordWhatTheTaskSees);

		runOnAnotherThread(decorated);

		assertThat(seen.get().thread()).isNotSameAs(Thread.currentThread());
		assertThat(seen.get().tenant()).isEmpty();
		assertThat(seen.get().logged()).isNull();
	}

	/** The end of the thread makes its writes visible to the test. */
	private static void runOnAnotherThread(Runnable task) throws InterruptedException {
		Thread.ofPlatform().start(task).join();
	}

	private void recordWhatTheTaskSees() {
		Optional<TenantId> tenant;
		try {
			tenant = Optional.of(currentTenant.get());
		}
		catch (NoCurrentTenantException ex) {
			tenant = Optional.empty();
		}
		seen.set(new Seen(Thread.currentThread(), tenant, MDC.get(TenantRunner.MDC_KEY)));
	}

	/** What a task sees on its thread: the current tenant and the tenant of its log lines. */
	private record Seen(Thread thread, Optional<TenantId> tenant, String logged) {
	}

}
