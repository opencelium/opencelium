package com.becon.opencelium.backend.execution.logger.service;

import com.becon.opencelium.backend.constant.props.LogProperties;
import com.becon.opencelium.backend.constant.props.SupportFileProperties;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;

import static com.becon.opencelium.backend.utility.LogFileUtility.create;

@Component
public class LogStorageInitializer {
    private final LogProperties logProperties;
    private final SupportFileProperties supportFileProperties;

    private static final Logger logger = LoggerFactory.getLogger(LogStorageInitializer.class);

    public LogStorageInitializer(LogProperties logProperties, SupportFileProperties supportFileProperties) {
        this.logProperties = logProperties;
        this.supportFileProperties = supportFileProperties;
    }

    @PostConstruct
    public void initialize() {
        try {
            // Create base directory to store support files:
            create(supportFileProperties.getDirectory());

            // Create base directory to store log files:
            create(logProperties.getLocation());
            logger.info("Base folders have been setup for support and log files.");
        } catch (IOException e) {
            logger.error("Failed to setup base folder for support and log files.");
        }
    }
}
