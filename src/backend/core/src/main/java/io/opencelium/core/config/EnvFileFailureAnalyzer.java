package io.opencelium.core.config;

import org.springframework.boot.diagnostics.AbstractFailureAnalyzer;
import org.springframework.boot.diagnostics.FailureAnalysis;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;

/**
 * Renders an {@link EnvFileException} as Boot's "APPLICATION FAILED TO START" report: the file, the line and the
 * problem, then what to change. The exception never holds a value of the file, so the report is safe to log.
 */
@Order(Ordered.HIGHEST_PRECEDENCE)
final class EnvFileFailureAnalyzer extends AbstractFailureAnalyzer<EnvFileException> {

	@Override
	protected FailureAnalysis analyze(Throwable rootFailure, EnvFileException cause) {
		return new FailureAnalysis(cause.getMessage(), cause.action(), cause);
	}

}
