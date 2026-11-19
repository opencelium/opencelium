package io.opencelium.core.tenant;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.slf4j.MDC;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.config.DeploymentMode;
import io.opencelium.core.config.OpenCeliumProperties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatException;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;

/**
 * The tenant runner binds the tenant of 1 task: the task reads it as the current tenant and finds it in the MDC key
 * {@code tenant}. In the self-host mode only the self-host tenant runs; in the cloud mode the tenant of a record runs,
 * but not a reserved tenant. A task never runs inside the task of another tenant, and the tenant ends with the task.
 */
class TenantRunnerTest {

	private static final TenantId ACME = TenantId.of("acme");

	private final CurrentTenant currentTenant = new CurrentTenant();

	private final List<TenantId> seen = new ArrayList<>();

	@AfterEach
	void noTenantStaysBound() {
		MDC.clear();
	}

	@Test
	void runGivesTheTenantToTheTaskWhenTheModeIsSelfHost() {
		runner(DeploymentMode.SELF_HOST).run(TenantId.SELF_HOST, this::recordCurrentTenant);

		assertThat(seen).containsExactly(TenantId.SELF_HOST);
	}

	@ParameterizedTest
	@ValueSource(strings = {"acme", "system"})
	void runStartsNoTaskWhenTheTenantIsNotTheSelfHostTenant(String tenant) {
		// A record with another tenant ID, for example from a database of a cloud installation, starts nothing.
		TenantRunner runner = runner(DeploymentMode.SELF_HOST);

		assertThatIllegalArgumentException().isThrownBy(() -> runner.run(TenantId.of(tenant), this::recordCurrentTenant))
				.withMessageContaining("'" + tenant + "'");
		assertThat(seen).isEmpty();
	}

	@Test
	void runGivesTheTenantOfTheRecordWhenTheModeIsCloud() {
		// A background task has no principal: the record that starts it, for example a schedule, names the tenant.
		Schedule schedule = new Schedule(ACME);

		runner(DeploymentMode.CLOUD).run(schedule.tenantId(), this::recordCurrentTenant);

		assertThat(seen).containsExactly(ACME);
	}

	@ParameterizedTest
	@ValueSource(strings = {"self-host-tenant", "system"})
	void runStartsNoTaskWhenTheTenantIsReservedInCloudMode(String tenant) {
		TenantRunner runner = runner(DeploymentMode.CLOUD);

		assertThatIllegalArgumentException().isThrownBy(() -> runner.run(TenantId.of(tenant), this::recordCurrentTenant))
				.withMessageContaining("'" + tenant + "'");
		assertThat(seen).isEmpty();
	}

	@Test
	void runStartsNoTaskWhenADifferentTenantIsBound() {
		TenantRunner runner = runner(DeploymentMode.CLOUD);

		assertThatIllegalStateException()
				.isThrownBy(() -> runner.run(ACME, () -> runner.run(TenantId.of("globex"), this::recordCurrentTenant)))
				.withMessageContaining("'globex'").withMessageContaining("'acme'");
		assertThat(seen).isEmpty();
	}

	@Test
	void runGivesTheTenantToTheTaskWhenTheSameTenantIsBound() {
		// A task that the work of a tenant starts on the same thread runs for that tenant.
		TenantRunner runner = runner(DeploymentMode.CLOUD);
		List<String> loggedAfterTheInnerTask = new ArrayList<>();

		runner.run(ACME, () -> {
			runner.run(ACME, this::recordCurrentTenant);
			loggedAfterTheInnerTask.add(MDC.get(TenantRunner.MDC_KEY));
		});

		assertThat(seen).containsExactly(ACME);
		// The rest of the outer task still writes its tenant into each log line.
		assertThat(loggedAfterTheInnerTask).containsExactly("acme");
		assertThat(MDC.get(TenantRunner.MDC_KEY)).isNull();
	}

	@Test
	void runRemovesTheTenantWhenTheTaskFails() {
		var failure = new IllegalStateException("the task fails");

		assertThatException().isThrownBy(() -> runner(DeploymentMode.CLOUD).run(ACME, () -> {
			throw failure;
		})).isSameAs(failure);
		assertThatExceptionOfType(NoCurrentTenantException.class).isThrownBy(currentTenant::get);
		assertThat(MDC.get(TenantRunner.MDC_KEY)).isNull();
	}

	@Test
	void runWritesTheMdcKeyWhenTheTaskRuns() {
		List<String> logged = new ArrayList<>();

		runner(DeploymentMode.CLOUD).run(ACME, () -> logged.add(MDC.get("tenant")));

		assertThat(logged).containsExactly("acme");
		assertThat(MDC.get("tenant")).isNull();
	}

	private void recordCurrentTenant() {
		seen.add(currentTenant.get());
	}

	private static TenantRunner runner(DeploymentMode mode) {
		return new TenantRunner(new OpenCeliumProperties(mode, Path.of("data"), Optional.empty()));
	}

	/** A record that starts a background task and carries the ID of its tenant. */
	private record Schedule(TenantId tenantId) {
	}

}
