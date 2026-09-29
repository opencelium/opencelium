package io.opencelium.core.secrets.keys;

import org.springframework.boot.diagnostics.AbstractFailureAnalyzer;
import org.springframework.boot.diagnostics.FailureAnalysis;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;

/** Renders a {@link KeyStartupException} as Boot's "APPLICATION FAILED TO START" report instead of a stack trace. */
@Order(Ordered.HIGHEST_PRECEDENCE)
final class KeyStartupFailureAnalyzer extends AbstractFailureAnalyzer<KeyStartupException> {

	@Override
	protected FailureAnalysis analyze(Throwable rootFailure, KeyStartupException cause) {
		return new FailureAnalysis(cause.getMessage(), cause.action(), cause);
	}

}
