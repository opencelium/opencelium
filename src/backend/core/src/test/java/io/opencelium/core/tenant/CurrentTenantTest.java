package io.opencelium.core.tenant;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.config.DeploymentMode;
import io.opencelium.core.config.OpenCeliumProperties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

/**
 * The current tenant is the tenant that the tenant runner binds for the work of this thread. Work outside the tenant
 * runner has none, and a read stops instead of giving a default tenant.
 */
class CurrentTenantTest {

	private final CurrentTenant currentTenant = new CurrentTenant();

	@Test
	void getGivesTheBoundTenantWhenTheTenantRunnerRunsTheTask() {
		List<TenantId> seen = new ArrayList<>();
		var runner = new TenantRunner(new OpenCeliumProperties(DeploymentMode.CLOUD, Path.of("data"), Optional.empty()));

		runner.run(TenantId.of("acme"), () -> seen.add(currentTenant.get()));

		assertThat(seen).containsExactly(TenantId.of("acme"));
	}

	@Test
	void getStopsWithNoCurrentTenantWhenNoTenantIsBound() {
		assertThatExceptionOfType(NoCurrentTenantException.class).isThrownBy(currentTenant::get)
				.withMessageContaining("No current tenant");
	}

}
