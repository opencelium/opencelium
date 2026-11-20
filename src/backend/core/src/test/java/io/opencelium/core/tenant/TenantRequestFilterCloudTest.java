package io.opencelium.core.tenant;

import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.testsupport.CloudStart;
import io.opencelium.core.testsupport.MongoIntegrationTest;
import io.opencelium.core.testsupport.fake.FakeTenantPrincipal;
import io.opencelium.core.testsupport.fake.TenantEndpoint;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;

/**
 * In the cloud mode the principal of a login gives the tenant of a request, and nothing else does: no header, no
 * parameter and no body. A request without a login runs without a tenant, and a principal with a reserved tenant
 * stops the request.
 */
@MongoIntegrationTest
@AutoConfigureMockMvc
@Import(TenantEndpoint.class)
class TenantRequestFilterCloudTest {

	private static final TenantId ACME = TenantId.of("acme");

	@TempDir
	static Path dataDir;

	@DynamicPropertySource
	static void properties(DynamicPropertyRegistry registry) {
		CloudStart.register(registry, TenantRequestFilterCloudTest.class, () -> dataDir);
	}

	@Autowired
	MockMvcTester mvc;

	@Test
	void doFilterBindsTheTenantOfThePrincipalWhenTheRequestIsAuthenticated() {
		assertThat(mvc.get().uri(TenantEndpoint.PATH).with(authentication(FakeTenantPrincipal.loggedIn(ACME))))
				.hasStatusOk().hasBodyTextEqualTo("acme");
	}

	@Test
	void doFilterIgnoresTheTenantIdWhenAHeaderAParameterAndTheBodyNameOne() {
		assertThat(mvc.post().uri(TenantEndpoint.PATH).with(authentication(FakeTenantPrincipal.loggedIn(ACME)))
				.header("X-Tenant-Id", "globex").header("tenantId", "globex").param("tenantId", "globex")
				.contentType(MediaType.APPLICATION_JSON).content("{\"tenantId\": \"globex\"}"))
				.hasStatusOk().hasBodyTextEqualTo("acme");
	}

	@Test
	void doFilterBindsNoTenantWhenTheRequestHasNoPrincipal() {
		assertThat(mvc.get().uri(TenantEndpoint.PATH)).hasStatusOk().hasBodyTextEqualTo(TenantEndpoint.NO_TENANT);
		// Without a login, a header, a parameter or the body does not take the place of the principal.
		assertThat(mvc.post().uri(TenantEndpoint.PATH).header("X-Tenant-Id", "acme").header("tenantId", "acme")
				.param("tenantId", "acme").contentType(MediaType.APPLICATION_JSON).content("{\"tenantId\": \"acme\"}"))
				.hasStatusOk().hasBodyTextEqualTo(TenantEndpoint.NO_TENANT);
	}

	@ParameterizedTest
	@ValueSource(strings = {"self-host-tenant", "system"})
	void doFilterStopsTheRequestWhenThePrincipalGivesAReservedValue(String reserved) {
		assertThat(mvc.get().uri(TenantEndpoint.PATH)
				.with(authentication(FakeTenantPrincipal.loggedIn(TenantId.of(reserved))))).hasFailed().failure()
				.isInstanceOf(IllegalArgumentException.class).hasMessageContaining("'" + reserved + "'");
	}

}
