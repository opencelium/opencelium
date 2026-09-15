package io.opencelium.core.config.secret;

import io.opencelium.common.secret.SecretProvider;
import io.opencelium.core.tenant.TenantDatabaseProvider;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

@Configuration(proxyBeanMethods = false)
public class SecretConfiguration {

    @Bean
    public AesGcmCipher aesGcmCipher() {
        return new AesGcmCipher();
    }

    @Bean
    @ConditionalOnBean(TenantDatabaseProvider.class)
    public SecretRepository mongoSecretRepository(TenantDatabaseProvider databases) {
        return new MongoSecretRepository(databases);
    }

    @Bean
    @ConditionalOnBean(TenantDatabaseProvider.class)
    @ConditionalOnProperty(prefix = "opencelium.security", name = "secret-provider",
            havingValue = "mongo", matchIfMissing = true)
    public SecretProvider mongoSecretProvider(SecretRepository repository, AesGcmCipher cipher, MasterKey masterKey) {
        return new MongoSecretProvider(repository, cipher, masterKey, Clock.systemUTC());
    }
}
