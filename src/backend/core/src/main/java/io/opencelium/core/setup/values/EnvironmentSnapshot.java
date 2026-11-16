package io.opencelium.core.setup.values;

import java.nio.file.InvalidPathException;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

import org.springframework.boot.context.properties.bind.BindException;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.context.properties.source.ConfigurationProperty;
import org.springframework.boot.context.properties.source.ConfigurationPropertyName;
import org.springframework.boot.context.properties.source.ConfigurationPropertySource;
import org.springframework.boot.context.properties.source.IterableConfigurationPropertySource;
import org.springframework.boot.origin.Origin;
import org.springframework.boot.origin.PropertySourceOrigin;
import org.springframework.core.env.AbstractEnvironment;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.env.SystemEnvironmentPropertySource;

import io.opencelium.core.config.BootstrapProperties;
import io.opencelium.core.config.OpenCeliumProperties;
import io.opencelium.core.secrets.keys.RootKeyResolver;
import io.opencelium.core.setup.files.YmlRenderer;

/**
 * The bootstrap values that the environment variables of the setup give, read 1 time when the setup starts, so a
 * variable that changes during the setup has no effect on it. Only the environment variables count: a system
 * property or an argument would apply at the start of this process only, and the setup refuses them. The values are
 * read through the Spring Boot binder on 1 property source, the environment variables under the name that the binder
 * reads with the name rules of environment variables. Thus each variable that the start reads for a property, for
 * example {@code OPENCELIUM_DATADIR} and {@code OPENCELIUM_DATA_DIR} for {@code opencelium.data-dir}, gives the same
 * value here, and each value keeps the name of its variable for the messages.
 * <p>
 * A value is the text as the start reads it: the port as the number that the binder converts, the data directory and
 * the key file as the absolute path that the start makes, without an expansion of {@code ~}. When the start cannot
 * read a text, the value is the text as written, and the check of a typed answer names the problem.
 */
public final class EnvironmentSnapshot {

	/** No environment variable gives a value: every question is asked. */
	public static final EnvironmentSnapshot NONE = new EnvironmentSnapshot(Map.of());

	private static final ConfigurationPropertyName MONGODB = ConfigurationPropertyName.of("spring.mongodb");

	private final Map<String, String> variables;

	private final IterableConfigurationPropertySource source;

	private final Binder binder;

	/**
	 * @param variables the environment variables of the setup ({@code System.getenv()} in production); copied, so
	 *                  a later change has no effect
	 */
	public EnvironmentSnapshot(Map<String, String> variables) {
		this.variables = Map.copyOf(variables);
		var propertySource = new SystemEnvironmentPropertySource(
				StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME, Map.<String, Object>copyOf(this.variables));
		this.source = (IterableConfigurationPropertySource) ConfigurationPropertySource.from(propertySource);
		this.binder = Binder.get(environmentOf(this.variables));
	}

	/**
	 * The names of the variables that give a bootstrap value, in the order of the steps: the data directory, the
	 * port, the MongoDB connection, the key file, the master key, the deployment mode. The names only: a value can be
	 * a secret.
	 */
	public List<String> names() {
		List<String> names = new ArrayList<>();
		variableOf(OpenCeliumProperties.DATA_DIR).ifPresent(names::add);
		variableOf(BootstrapProperties.SERVER_PORT).ifPresent(names::add);
		names.addAll(mongoDbVariables());
		if (variables.containsKey(YmlRenderer.MONGO_URI_VARIABLE)) {
			names.add(YmlRenderer.MONGO_URI_VARIABLE);
		}
		variableOf(OpenCeliumProperties.MASTER_KEY_FILE).ifPresent(names::add);
		if (variables.containsKey(RootKeyResolver.ENV_VARIABLE)) {
			names.add(RootKeyResolver.ENV_VARIABLE);
		}
		variableOf(OpenCeliumProperties.DEPLOYMENT_MODE).ifPresent(names::add);
		return names;
	}

	/**
	 * The names of the variables that give a property under {@code spring.mongodb}, sorted, for example
	 * {@code SPRING_MONGODB_URI}: the start reads the MongoDB connection from them.
	 */
	public List<String> mongoDbVariables() {
		return source.stream().filter(MONGODB::isAncestorOf).map(this::variable).flatMap(Optional::stream).distinct()
				.sorted().toList();
	}

	/**
	 * The text of an environment variable as written, for a value that the start reads under the name of the variable
	 * itself, for example {@code OC_MASTER_KEY}. The text can be a secret: a message names the variable, never the
	 * text.
	 *
	 * @return empty when the variable is not set
	 */
	public Optional<String> text(String variable) {
		return Optional.ofNullable(variables.get(variable));
	}

	/**
	 * A new Spring environment with these variables as its only property source, for code that reads the environment
	 * as the start does, for example the connection resolution of MongoDB. Each call gives a new environment, so a
	 * property source that the caller adds has no effect on this snapshot.
	 */
	public ConfigurableEnvironment asEnvironment() {
		return environmentOf(variables);
	}

	private static ConfigurableEnvironment environmentOf(Map<String, String> variables) {
		var environment = new AbstractEnvironment() {
		};
		environment.getPropertySources().addFirst(new SystemEnvironmentPropertySource(
				StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME, Map.<String, Object>copyOf(variables)));
		return environment;
	}

	/**
	 * The value of a bootstrap property as the start reads it, with the name of its variable.
	 *
	 * @param property the name of the property, for example {@code server.port}
	 * @return empty when no variable gives the property
	 */
	public Optional<Value> value(String property) {
		ConfigurationProperty found = source.getConfigurationProperty(ConfigurationPropertyName.of(property));
		if (found == null) {
			return Optional.empty();
		}
		String asWritten = binder.bind(property, String.class).orElse(String.valueOf(found.getValue()));
		return Optional.of(new Value(variable(found), asTheStartReadsIt(property, asWritten)));
	}

	/**
	 * The text of a property as the start reads it, or as written when the start cannot read it: a text that is no
	 * number, also an empty text, which the binder converts to no number at all.
	 */
	private String asTheStartReadsIt(String property, String text) {
		if (property.equals(BootstrapProperties.SERVER_PORT)) {
			try {
				return binder.bind(property, Integer.class).map(Object::toString).orElse(text);
			}
			catch (BindException ex) {
				return text;
			}
		}
		if (property.equals(OpenCeliumProperties.DATA_DIR) || property.equals(OpenCeliumProperties.MASTER_KEY_FILE)) {
			try {
				return Path.of(text).toAbsolutePath().normalize().toString();
			}
			catch (InvalidPathException ex) {
				return text;
			}
		}
		return text;
	}

	/**
	 * The name of the variable that gives a bootstrap property, for a message; the name only, because the value can
	 * be a secret.
	 *
	 * @param property the name of the property, for example {@code spring.mongodb.password}
	 * @return empty when no variable gives the property
	 */
	public Optional<String> variableOf(String property) {
		return variable(ConfigurationPropertyName.of(property));
	}

	private Optional<String> variable(ConfigurationPropertyName property) {
		return Optional.ofNullable(source.getConfigurationProperty(property)).map(EnvironmentSnapshot::variable);
	}

	/** The variable that gives a property: the name under which the property source holds the value. */
	private static String variable(ConfigurationProperty found) {
		Origin origin = found.getOrigin();
		if (!(origin instanceof PropertySourceOrigin propertySourceOrigin)) {
			throw new IllegalStateException("The property " + found.getName() + " has no variable name.");
		}
		return propertySourceOrigin.getPropertyName();
	}

	/**
	 * A bootstrap value from the environment.
	 *
	 * @param variable the name of the environment variable that gives it, for example {@code SERVER_PORT}
	 * @param text     the value as the start reads it
	 */
	public record Value(String variable, String text) {

		public Value {
			Objects.requireNonNull(variable, "variable");
			Objects.requireNonNull(text, "text");
		}

		/** Without the text: it can be a secret, for example a database password. */
		@Override
		public String toString() {
			return "Value[variable=" + variable + "]";
		}

	}

}
