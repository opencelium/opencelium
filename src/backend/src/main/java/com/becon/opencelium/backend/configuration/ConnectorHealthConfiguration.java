/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.configuration;

import com.becon.opencelium.backend.constant.AppYamlPath;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.ThreadPoolExecutor;

/**
 * Executor for the background connector health monitor.
 */
@Configuration
public class ConnectorHealthConfiguration {

    /**
     * Bounded pool dedicated to connector health checks. When the queue is full,
     * further checks of a sweep are silently discarded — they are simply retried on
     * the next sweep, so saturation never blocks the scheduler thread.
     */
    @Bean(name = "connectorHealthTaskExecutor")
    public ThreadPoolTaskExecutor connectorHealthTaskExecutor(
            @Value("${" + AppYamlPath.CONNECTOR_HEALTH_PARALLELISM + ":4}") int parallelism) {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(parallelism);
        executor.setMaxPoolSize(parallelism);
        executor.setQueueCapacity(1000);
        executor.setThreadNamePrefix("connector-health-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.DiscardPolicy());
        return executor;
    }
}
