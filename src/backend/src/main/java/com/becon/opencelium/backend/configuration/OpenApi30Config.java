package com.becon.opencelium.backend.configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.tags.Tag;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
public class OpenApi30Config {

    @Bean
    public OpenAPI api() {
        final String securitySchemeName = "bearerAuth";
        final String apiTitle = String.format("%s API", StringUtils.capitalize("OpenCelium"));
        return new OpenAPI()
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(
                    new Components()
                        .addSecuritySchemes(securitySchemeName,
                            new SecurityScheme()
                                    .name(securitySchemeName)
                                    .type(SecurityScheme.Type.HTTP)
                                    .scheme("bearer")
                                    .bearerFormat("JWT")
                        )
                )
                .info(new Info().title(apiTitle).version("3.0"));
    }
}
