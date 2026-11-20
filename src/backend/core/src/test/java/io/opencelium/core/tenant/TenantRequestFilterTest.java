package io.opencelium.core.tenant;

import java.nio.file.Path;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.testsupport.LocalMongo;
import io.opencelium.core.testsupport.MongoIntegrationTest;
import io.opencelium.core.testsupport.fake.FakeTenantPrincipal;
import io.opencelium.core.testsupport.fake.TenantEndpoint;
import io.opencelium.core.testsupport.fixture.TestDocument;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;

/**
 * In the self-host mode each request runs for the 1 tenant of the installation, with or without a login. A document
 * that a request writes holds that tenant, also when the body of the request names another one.
 */
@MongoIntegrationTest
@AutoConfigureMockMvc
@Import(TenantEndpoint.class)
class TenantRequestFilterTest {

	@TempDir
	static Path dataDir;

	@DynamicPropertySource
	static void properties(DynamicPropertyRegistry registry) {
		LocalMongo.register(registry, TenantRequestFilterTest.class, () -> dataDir);
	}

	@Autowired
	MockMvcTester mvc;

	@Autowired
	MongoTemplate mongo;

	@BeforeEach
	void removeDocuments() {
		mongo.dropCollection(TestDocument.class);
	}

	@Test
	void doFilterBindsTheSelfHostTenantWhenTheRequestHasAPrincipal() {
		// The principal is not the source of the tenant here: the installation has 1 tenant. The tenant runner of the
		// self-host mode refuses "acme", so a filter that reads the principal makes this request fail.
		Authentication login = FakeTenantPrincipal.loggedIn(TenantId.of("acme"));

		assertThat(mvc.get().uri(TenantEndpoint.PATH).with(authentication(login))).hasStatusOk()
				.hasBodyTextEqualTo("self-host-tenant");
	}

	@Test
	void doFilterBindsTheSelfHostTenantWhenTheRequestHasNoPrincipal() {
		assertThat(mvc.get().uri(TenantEndpoint.PATH)).hasStatusOk().hasBodyTextEqualTo("self-host-tenant");
	}

	@Test
	void doFilterKeepsTheCurrentTenantInTheDocumentWhenTheBodyNamesAnotherTenant() {
		assertThat(mvc.post().uri(TenantEndpoint.DOCUMENTS_PATH).contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\": \"from-the-request\", \"tenantId\": \"other\"}")).hasStatusOk();

		assertThat(mongo.findAll(TestDocument.class)).singleElement().satisfies(stored -> {
			assertThat(stored.name()).isEqualTo("from-the-request");
			assertThat(stored.tenantId()).isEqualTo("self-host-tenant");
		});
	}

}
