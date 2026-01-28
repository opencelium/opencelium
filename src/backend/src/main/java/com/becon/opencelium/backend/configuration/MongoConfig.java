package com.becon.opencelium.backend.configuration;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

@Configuration
@EnableMongoAuditing(auditorAwareRef = "securityAuditorAware")
public class MongoConfig {
}