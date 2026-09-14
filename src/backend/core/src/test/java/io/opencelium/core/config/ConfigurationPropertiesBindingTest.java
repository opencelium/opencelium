package io.opencelium.core.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.env.SystemEnvironmentPropertySource;

import java.time.Duration;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Proves what the operator is promised: the environment wins over the file, defaults apply, and a
 * wrong or misspelled value stops startup with a message that names the property.
 */
class ConfigurationPropertiesBindingTest {

    private final ApplicationContextRunner runner = new ApplicationContextRunner();

    @Test
    void modeBindsFromTheEnvironmentVariableWhenTheYamlSetsAnotherValue() {
        runner.withUserConfiguration(TenancyConfig.class)
                .withInitializer(context -> {
                    ConfigurableEnvironment environment = context.getEnvironment();
                    environment.getPropertySources().addLast(new MapPropertySource("application.yaml",
                            Map.of("opencelium.tenancy.mode", "self-hosted")));
                    environment.getPropertySources().addFirst(new SystemEnvironmentPropertySource(
                            StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME,
                            Map.of("OPENCELIUM_TENANCY_MODE", "cloud")));
                })
                .run(context -> assertThat(context.getBean(TenancyProperties.class).mode())
                        .isEqualTo(TenancyProperties.Mode.CLOUD));
    }

    @Test
    void defaultsApplyWhenNothingIsConfigured() {
        runner.withUserConfiguration(TenancyConfig.class).run(context -> {
            TenancyProperties properties = context.getBean(TenancyProperties.class);

            assertThat(properties.isSelfHosted()).isTrue();
            assertThat(properties.selfHosted().verifyConnectionOnStartup()).isTrue();
            assertThat(properties.cloud().clientCache().maxSize()).isEqualTo(50);
            assertThat(properties.cloud().connectTimeout()).isEqualTo(Duration.ofSeconds(10));
        });
    }

    @Test
    void durationsAreReadAsDurationsRatherThanNumbers() {
        runner.withUserConfiguration(TenancyConfig.class)
                .withPropertyValues("opencelium.tenancy.cloud.db-info-refresh=45m")
                .run(context -> assertThat(context.getBean(TenancyProperties.class).cloud().dbInfoRefresh())
                        .isEqualTo(Duration.ofMinutes(45)));
    }

    @Test
    void startupFailsNamingThePropertyWhenTheModeIsNotAKnownValue() {
        runner.withUserConfiguration(TenancyConfig.class)
                .withPropertyValues("opencelium.tenancy.mode=galaxy")
                .run(context -> assertThat(context).hasFailed()
                        .getFailure()
                        .hasStackTraceContaining("opencelium.tenancy.mode"));
    }

    @Test
    void startupFailsOnAMisspelledKeySoATypoCannotBeSilentlyIgnored() {
        runner.withUserConfiguration(TenancyConfig.class)
                .withPropertyValues("opencelium.tenancy.mdoe=cloud")
                .run(context -> assertThat(context).hasFailed()
                        .getFailure()
                        .hasStackTraceContaining("mdoe"));
    }

    @Test
    void startupFailsWhenAValueIsOutsideItsAllowedRange() {
        runner.withUserConfiguration(TenancyConfig.class)
                .withPropertyValues("opencelium.tenancy.cloud.client-cache.max-size=0")
                .run(context -> assertThat(context).hasFailed()
                        .getFailure()
                        .hasStackTraceContaining("maxSize"));
    }

    @Configuration(proxyBeanMethods = false)
    @EnableConfigurationProperties(TenancyProperties.class)
    static class TenancyConfig { }
}
