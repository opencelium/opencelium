package io.opencelium.core.tenant;

import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.testsupport.CloudStart;
import io.opencelium.core.testsupport.MongoIntegrationTest;
import io.opencelium.core.testsupport.fixture.TestDocument;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

/**
 * The tenant-document access in the cloud mode, where the database of the yml file is the system database. Work
 * without a current tenant gets no default tenant. Before the tenant catalog, the connection resolver has no database
 * for a tenant, so no tenant document goes to the system database.
 */
@MongoIntegrationTest
class TenantDocumentsCloudTest {

	private static final TenantId ACME = TenantId.of("acme");

	@TempDir
	static Path dataDir;

	@DynamicPropertySource
	static void properties(DynamicPropertyRegistry registry) {
		CloudStart.register(registry, TenantDocumentsCloudTest.class, () -> dataDir);
	}

	@Autowired
	TenantDocuments documents;

	@Autowired
	TenantRunner tenantRunner;

	/** The system database. */
	@Autowired
	MongoTemplate mongo;

	@Test
	void findStopsWithNoCurrentTenantWhenNoTenantIsBound() {
		assertThatExceptionOfType(NoCurrentTenantException.class)
				.isThrownBy(() -> documents.find(TestDocument.class, new Criteria()));
	}

	@Test
	void insertStopsWithTheErrorOfTheConnectionResolverWhenTheTenantHasNoDatabase() {
		assertThatExceptionOfType(UnsupportedOperationException.class)
				.isThrownBy(() -> tenantRunner.run(ACME, () -> documents.insert(TestDocument.of(ACME.value(), "new"))))
				.withMessageContaining("No database for tenant acme");
		assertThat(mongo.count(new Query(), TestDocument.class)).isZero();
	}

}
