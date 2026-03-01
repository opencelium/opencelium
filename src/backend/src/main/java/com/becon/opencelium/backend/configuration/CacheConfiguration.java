package com.becon.opencelium.backend.configuration;

import org.springframework.cache.CacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CacheConfiguration {

    public static final String EXECUTION_STATS = "executionStats";

    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager(EXECUTION_STATS);
    }
}
