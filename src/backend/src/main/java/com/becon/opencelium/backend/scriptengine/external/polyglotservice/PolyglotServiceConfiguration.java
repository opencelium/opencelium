package com.becon.opencelium.backend.scriptengine.external.polyglotservice;

import com.becon.opencelium.backend.constant.props.PolyglotProps;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(PolyglotProps.class)
public class PolyglotServiceConfiguration {

    private static final Logger logger = LoggerFactory.getLogger(PolyglotServiceConfiguration.class);

    @Bean
    public ApplicationRunner polyglotServiceStarter(PolyglotServiceManager serviceManager, PolyglotProps polyglotProps) {
        return args -> {
            try {
                if (polyglotProps.isEnabled() && polyglotProps.isAutoStart()) {
                    serviceManager.start();
                }
            } catch (PolyglotServiceManager.PolyglotStartupException e) {
                logger.error("Failed to start Polyglot service. Falling back to Nashorn engine.", e);
                // Don't throw - allow application to start with fallback
            }
        };
    }
}