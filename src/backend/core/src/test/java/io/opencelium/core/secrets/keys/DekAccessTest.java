package io.opencelium.core.secrets.keys;

import java.nio.file.Path;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.testsupport.LocalMongo;
import io.opencelium.core.testsupport.MongoIntegrationTest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * The DEK of an owner is available for 1 operation and is zeroed after it. The system DEK exists from the first start;
 * an owner without a DEK stops the operation.
 */
@MongoIntegrationTest
class DekAccessTest {

	@TempDir
	static Path dataDir;

	@DynamicPropertySource
	static void properties(DynamicPropertyRegistry registry) {
		LocalMongo.register(registry, DekAccessTest.class, () -> dataDir);
	}

	@Autowired
	DekAccess dekAccess;

	@Autowired
	MongoTemplate mongo;

	@Autowired
	DekWrapper wrapper;

	@Autowired
	RootKey rootKey;

	@Test
	void useGivesTheSystemDekWhenTheOwnerIsSystem() {
		byte[] systemDek = wrapper.unwrap(rootKey, mongo.findOne(Query.query(Criteria.where("tenantId").is("system")),
				WrappedDek.class));
		var given = new AtomicReference<byte[]>();

		int version = dekAccess.use(TenantId.SYSTEM, (dekVersion, dek) -> {
			assertThat(dek).as("the unwrapped system DEK").isEqualTo(systemDek);
			given.set(dek);
			return dekVersion;
		});

		assertThat(version).isEqualTo(1);
		assertThat(given.get()).as("the DEK after the operation").isEqualTo(new byte[32]);
		int byVersion = dekAccess.use(TenantId.SYSTEM, 1, (dekVersion, dek) -> dekVersion);
		assertThat(byVersion).as("the version of the DEK of version 1").isEqualTo(1);
	}

	@Test
	void useZeroesTheDekWhenTheOperationFails() {
		var given = new AtomicReference<byte[]>();

		assertThatThrownBy(() -> dekAccess.use(TenantId.SYSTEM, (dekVersion, dek) -> {
			given.set(dek);
			throw new IllegalArgumentException("the operation failed");
		})).isInstanceOf(IllegalArgumentException.class);

		assertThat(given.get()).as("the DEK after the failed operation").isEqualTo(new byte[32]);
	}

	@Test
	void useStopsWhenTheOwnerHasNoDek() {
		assertThatThrownBy(() -> dekAccess.use(TenantId.of("tenant-a"), (dekVersion, dek) -> dekVersion))
				.isInstanceOf(IllegalStateException.class).hasMessageContaining("tenant-a");
		assertThatThrownBy(() -> dekAccess.use(TenantId.SYSTEM, 2, (dekVersion, dek) -> dekVersion))
				.isInstanceOf(IllegalStateException.class);
	}

}
