package io.opencelium.core.config;

import java.util.Optional;

/**
 * A bootstrap property the operator must fix. Stops the application; {@link BootstrapFailureAnalyzer} renders the
 * message together with the offending property name, and an action: by default "set this property", or the specific
 * action given here when the fix is something else (for example removing a conflicting property).
 */
public final class BootstrapPropertyException extends RuntimeException {

	private final String propertyName;

	private final String action;

	public BootstrapPropertyException(String propertyName, String message) {
		this(propertyName, message, null, null);
	}

	public BootstrapPropertyException(String propertyName, String message, Throwable cause) {
		this(propertyName, message, null, cause);
	}

	/**
	 * @param action what the operator should do, replacing the default "set the property" advice; {@code null} for
	 *               the default
	 * @param cause  may be {@code null}; leave it out when its message could quote a secret
	 */
	public BootstrapPropertyException(String propertyName, String message, String action, Throwable cause) {
		super(message, cause);
		this.propertyName = propertyName;
		this.action = action;
	}

	public String propertyName() {
		return propertyName;
	}

	public Optional<String> action() {
		return Optional.ofNullable(action);
	}

}
