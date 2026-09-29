package io.opencelium.core.config;

import java.time.Clock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public final class ClockConfig {

	/** The system clock in UTC. Code that needs the time takes this bean, so tests can move time. */
	@Bean
	Clock clock() {
		return Clock.systemUTC();
	}

}
