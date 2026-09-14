package io.opencelium.core.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;

@Validated
@ConfigurationProperties(prefix = "opencelium.tenancy", ignoreUnknownFields = false)
public record TenancyProperties(

        @NotNull @DefaultValue("self-hosted") Mode mode,

        @Valid @NotNull @DefaultValue SelfHosted selfHosted,

        @Valid @NotNull @DefaultValue Cloud cloud) {

    public enum Mode {
        /** One client, whose MongoDB is configured at startup. */
        SELF_HOSTED,
        /** Many clients, each database supplied by the Service Portal after login. */
        CLOUD
    }

    public boolean isSelfHosted() {
        return mode == Mode.SELF_HOSTED;
    }

    public boolean isCloud() {
        return mode == Mode.CLOUD;
    }

    /**
     * @param verifyConnectionOnStartup ping the database while starting, so a wrong URI or password
     *                                  fails immediately instead of on the first query
     */
    public record SelfHosted(@DefaultValue("true") boolean verifyConnectionOnStartup) { }

    /**
     * @param clientCache    bounds the per-client connections core keeps open
     * @param pool           connection pool of a single client's database
     * @param connectTimeout how long to wait for one client's database before failing that client's
     *                       request, so a client whose database is down cannot stall the others
     * @param dbInfoRefresh  how long portal-supplied database info is reused before it is fetched
     *                       again, which is how a credential rotation in the portal reaches core
     */
    public record Cloud(

            @Valid @NotNull @DefaultValue ClientCache clientCache,

            @Valid @NotNull @DefaultValue Pool pool,

            @NotNull @DefaultValue("10s") Duration connectTimeout,

            @NotNull @DefaultValue("15m") Duration dbInfoRefresh) { }

    public record ClientCache(

            @Min(1) @DefaultValue("50") int maxSize,

            @NotNull @DefaultValue("30m") Duration idleTimeout) { }

    public record Pool(@Min(1) @DefaultValue("20") int maxSizePerTenant) { }
}
