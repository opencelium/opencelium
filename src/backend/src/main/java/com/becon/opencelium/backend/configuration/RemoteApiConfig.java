package com.becon.opencelium.backend.configuration;

import com.becon.opencelium.backend.constant.props.ServicePortalProps;
import com.becon.opencelium.backend.constant.AppYamlPath;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RemoteApiConfig {

    private static final Logger logger = LoggerFactory.getLogger(RemoteApiConfig.class);

    @Bean("servicePortalRestTemplate")
    public RestTemplate servicePortalRestTemplate(ServicePortalProps props, RestTemplateBuilder builder) {
        if (props.token() == null || props.token().isEmpty()) {
            logger.error("Token for the Service Portal Auth is not set. " +
                    "Please check your settings in application.yml file. Path: " + AppYamlPath.SP_TOKEN);
        }
        if (props.baseUrl() == null || props.baseUrl().isEmpty()) {
            logger.error("Base URL for the Service Portal is not set. " +
                    "Please check your settings in application.yml file. Path: " + AppYamlPath.SP_BASE_URL);
        }
        return builder
                .rootUri(props.baseUrl())
                .additionalInterceptors((request, body, execution) -> {
                    request.getHeaders().add("x-access-token", props.token());
                    return execution.execute(request, body);
                })
                .build();
    }
}
