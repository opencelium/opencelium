package io.opencelium.core.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;

import static org.assertj.core.api.Assertions.assertThat;

class SecurityPropertiesTest {

    private static final String CANARY = "canary-8f31c2a7";

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withUserConfiguration(SecurityConfig.class);

    @Test
    void toStringNeverPrintsTheMasterKey() {
        runner.withPropertyValues("opencelium.security.master-key=" + CANARY)
                .run(context -> assertThat(context.getBean(SecurityProperties.class).toString())
                        .doesNotContain("canary")
                        .contains("***"));
    }

    @Test
    void startupFailsNamingThePropertyWhenTheMasterKeyIsMissing() {
        runner.run(context -> assertThat(context).hasFailed()
                .getFailure()
                .hasStackTraceContaining("opencelium.security")
                .hasStackTraceContaining("masterKey")
                .hasStackTraceContaining("must not be blank"));
    }

    @Test
    void startupFailsWhenTheMasterKeyIsConfiguredButEmpty() {
        runner.withPropertyValues("opencelium.security.master-key=")
                .run(context -> assertThat(context).hasFailed()
                        .getFailure()
                        .hasStackTraceContaining("masterKey"));
    }

    @Configuration(proxyBeanMethods = false)
    @EnableConfigurationProperties(SecurityProperties.class)
    static class SecurityConfig { }
}
