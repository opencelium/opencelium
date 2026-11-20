package io.opencelium.core.secrets.keys;

import java.nio.file.Path;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.testsupport.CloudStart;
import io.opencelium.core.testsupport.MongoIntegrationTest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.data.mongodb.core.query.Criteria.where;

/** The signing key in the cloud mode, where the database of the yml file is the system database. */
@MongoIntegrationTest
class SigningKeyLoaderCloudTest {

	@TempDir
	static Path dataDir;

	@DynamicPropertySource
	static void properties(DynamicPropertyRegistry registry) {
		CloudStart.register(registry, SigningKeyLoaderCloudTest.class, () -> dataDir);
	}

	/** The system database. */
	@Autowired
	MongoTemplate mongo;

	@Autowired
	RootKey rootKey;

	@Autowired
	ApplicationContext context;

	@Test
	void loadStoresTheSigningKeyInTheSystemDatabaseWhenTheModeIsCloud() {
		List<WrappedDek> systemDeks = mongo.find(Query.query(where("tenantId").is(TenantId.SYSTEM.value())),
				WrappedDek.class);
		List<EncryptedSigningKey> signingKeys = mongo.findAll(EncryptedSigningKey.class);
		assertThat(systemDeks).hasSize(1);
		assertThat(signingKeys).hasSize(1);

		byte[] systemDek = new DekWrapper().unwrap(rootKey, systemDeks.getFirst());
		byte[] stored = new SigningKeyCipher().decrypt(systemDek, signingKeys.getFirst());

		assertThat(stored).isEqualTo(context.getBean(SigningKeyLoader.class).signingKey().secretKey().getEncoded());
	}

}
