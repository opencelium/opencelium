package io.opencelium.core.config.secret;

import io.opencelium.common.secret.SecretProvider;
import io.opencelium.core.tenant.StaticTenantDatabaseProvider;
import io.opencelium.core.tenant.TenantDatabaseProvider;
import io.opencelium.core.testutil.TestKeys;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The secret store is wired only when something can resolve a client's database. This proves the
 * self-hosted path produces a usable provider — the condition is easy to break by accident.
 */
@SpringBootTest
@ActiveProfiles("test")
class SecretConfigurationTest {

    @DynamicPropertySource
    static void keys(DynamicPropertyRegistry registry) {
        registry.add("opencelium.security.master-key", TestKeys::base64Aes256);
        registry.add("opencelium.auth.jwt.signing-key", TestKeys::base64Aes256);
    }

    @Autowired
    private SecretProvider secretProvider;

    @Autowired
    private TenantDatabaseProvider tenantDatabaseProvider;

    @Test
    void selfHostedModeWiresTheMongoSecretStore() {
        assertThat(secretProvider).isInstanceOf(MongoSecretProvider.class);
        assertThat(tenantDatabaseProvider).isInstanceOf(StaticTenantDatabaseProvider.class);
    }
}
