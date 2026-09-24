package io.opencelium.core.config;

import java.util.Arrays;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * How this installation is operated. Bound from {@code opencelium.deployment-mode}; {@link #DEFAULT} when absent.
 */
public enum DeploymentMode {

	/**
	 * Self-hosted: one customer, whose MongoDB is configured in application.yml. {@code spring.mongodb.uri} defaults
	 * to {@code mongodb://localhost:27017/opencelium}.
	 */
	SELF("self", true),

	/**
	 * Operated by us for many tenants; application.yml names only the system database. {@code spring.mongodb.uri} has
	 * no default and is required. Not enforced yet: the check belongs to the MongoDB connection resolver (increment 0,
	 * slice 2), which also replaces Boot's own Mongo auto-configuration and its {@code localhost/test} fallback.
	 */
	SAAS("saas", false);

	public static final DeploymentMode DEFAULT = SELF;

	private final String propertyValue;

	private final boolean mongoUriHasDefault;

	DeploymentMode(String propertyValue, boolean mongoUriHasDefault) {
		this.propertyValue = propertyValue;
		this.mongoUriHasDefault = mongoUriHasDefault;
	}

	/** The spelling used in application.yml. */
	public String propertyValue() {
		return propertyValue;
	}

	/** Whether a missing {@code spring.mongodb.uri} gets the documented default in this mode. */
	public boolean mongoUriHasDefault() {
		return mongoUriHasDefault;
	}

	/**
	 * Parses the yml spelling. Case and {@code _} versus {@code -} are ignored, so the enum name works too.
	 */
	public static Optional<DeploymentMode> parse(String value) {
		if (value == null) {
			return Optional.empty();
		}
		String normalized = value.strip().toLowerCase(Locale.ROOT).replace('_', '-');
		return Arrays.stream(values()).filter(mode -> mode.propertyValue.equals(normalized)).findFirst();
	}

	static String allowedValues() {
		return Arrays.stream(values()).map(DeploymentMode::propertyValue).collect(Collectors.joining(", "));
	}

}
