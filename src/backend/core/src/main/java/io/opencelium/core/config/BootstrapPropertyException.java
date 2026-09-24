package io.opencelium.core.config;

/**
 * A bootstrap property the operator must fix. Stops the application; {@link BootstrapFailureAnalyzer} renders the
 * message together with the offending property name.
 */
public final class BootstrapPropertyException extends RuntimeException {

	private final String propertyName;

	public BootstrapPropertyException(String propertyName, String message) {
		super(message);
		this.propertyName = propertyName;
	}

	public BootstrapPropertyException(String propertyName, String message, Throwable cause) {
		super(message, cause);
		this.propertyName = propertyName;
	}

	public String propertyName() {
		return propertyName;
	}

}
