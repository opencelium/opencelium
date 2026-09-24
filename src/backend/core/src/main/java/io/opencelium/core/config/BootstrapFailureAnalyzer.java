package io.opencelium.core.config;

import java.util.Locale;

import org.springframework.boot.diagnostics.AbstractFailureAnalyzer;
import org.springframework.boot.diagnostics.FailureAnalysis;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;

/**
 * Renders a {@link BootstrapPropertyException} as Boot's "APPLICATION FAILED TO START" report, ending the
 * description with {@code Property: <name>}. Boot uses the first analyzer that matches; ours is the most specific
 * one for this failure, so it goes first.
 */
@Order(Ordered.HIGHEST_PRECEDENCE)
final class BootstrapFailureAnalyzer extends AbstractFailureAnalyzer<BootstrapPropertyException> {

	@Override
	protected FailureAnalysis analyze(Throwable rootFailure, BootstrapPropertyException cause) {
		String property = cause.propertyName();
		String description = cause.getMessage() + "\n\n  Property: " + property;
		String action = "Set " + property + " in application.yml, or the environment variable "
				+ environmentVariable(property) + ", then start again.";
		return new FailureAnalysis(description, action, cause);
	}

	/** The environment variable Spring's relaxed binding maps to {@code property}. */
	static String environmentVariable(String property) {
		return property.replace("-", "").replace('.', '_').toUpperCase(Locale.ROOT);
	}

}
