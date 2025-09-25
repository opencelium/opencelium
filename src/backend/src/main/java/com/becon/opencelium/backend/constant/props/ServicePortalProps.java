package com.becon.opencelium.backend.constant.props;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "opencelium.service-portal")
public record ServicePortalProps(
        @NotBlank String baseUrl,
        @NotBlank String token
) {}
