package io.opencelium.core.config;

import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.net.URI;

@Validated
@ConfigurationProperties(prefix = "opencelium.service-portal", ignoreUnknownFields = false)
public record ServicePortalProperties(

        @NotNull URI baseUrl,

        String apiToken) {

    public boolean hasApiToken() {
        return apiToken != null && !apiToken.isBlank();
    }

    @Override
    public String toString() {
        return "ServicePortalProperties[baseUrl=" + baseUrl + ", apiToken=" + (hasApiToken() ? "***" : "unset") + "]";
    }
}
