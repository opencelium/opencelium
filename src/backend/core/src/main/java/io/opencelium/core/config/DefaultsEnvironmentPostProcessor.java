package io.opencelium.core.config;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

import org.apache.commons.logging.Log;
import org.springframework.boot.EnvironmentPostProcessor;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.logging.DeferredLogFactory;
import org.springframework.boot.mongodb.autoconfigure.MongoProperties;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import io.opencelium.common.tenant.TenantId;

/**
 * Supplies the documented default for every bootstrap property that has one and was left out, as the
 * lowest-priority property source, and logs one {@code (default)} line per applied default.
 * {@code opencelium.master-key-file} has no default here; the root key resolver has its own lookup order. The default
 * of {@code logging.pattern.correlation} puts the tenant ID into each application log line: the MDC key
 * {@code tenant}, which the tenant runner writes for the time of a task of a tenant.
 * <p>
 * Lines go through Boot's deferred log, so they appear even when startup fails later (for example when the
 * default MongoDB is not reachable).
 */
public final class DefaultsEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

	public static final String PROPERTY_SOURCE_NAME = "openceliumDefaults";

	static final String DEFAULT_MONGODB_URI = "mongodb://localhost:27017/opencelium";

	/** A line without a bound tenant names the 1 tenant of the installation, so a line of the start has it too. */
	static final String SELF_HOST_LOG_CORRELATION_PATTERN = "[%X{tenant:-" + TenantId.SELF_HOST + "}] ";

	/** A line without a bound tenant shows {@code -}: the start and the threads of the engine run for no tenant. */
	static final String CLOUD_LOG_CORRELATION_PATTERN = "[%X{tenant:--}] ";

	private static final String BOOT3_MONGODB_URI = "spring.data.mongodb.uri";

	private final Log log;

	private final DataDirDefaults dataDirDefaults;

	public DefaultsEnvironmentPostProcessor(DeferredLogFactory logFactory) {
		this(logFactory, DataDirDefaults.forThisHost());
	}

	DefaultsEnvironmentPostProcessor(DeferredLogFactory logFactory, DataDirDefaults dataDirDefaults) {
		this.log = logFactory.getLog(DefaultsEnvironmentPostProcessor.class);
		this.dataDirDefaults = dataDirDefaults;
	}

	@Override
	public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
		applyDefaults(environment);
	}

	/**
	 * Adds the default of each bootstrap property that {@code environment} leaves out, as the start does. The setup
	 * wizard calls it before Spring starts, on an environment of its own variables, to read them as the start does.
	 */
	public void applyDefaults(ConfigurableEnvironment environment) {
		Binder binder = Binder.get(environment);
		Map<String, Object> defaults = new LinkedHashMap<>();

		Optional<String> configuredMode = BootstrapProperties.read(binder, OpenCeliumProperties.DEPLOYMENT_MODE);
		if (configuredMode.isEmpty()) {
			defaults.put(OpenCeliumProperties.DEPLOYMENT_MODE, DeploymentMode.DEFAULT.propertyValue());
		}
		if (BootstrapProperties.read(binder, OpenCeliumProperties.DATA_DIR).isEmpty()) {
			defaults.put(OpenCeliumProperties.DATA_DIR, dataDirDefaults.resolve().toString());
		}

		if (BootstrapProperties.read(binder, BOOT3_MONGODB_URI).isPresent()) {
			log.warn(BOOT3_MONGODB_URI + " is set but ignored; Spring Boot 4 reads " + BootstrapProperties.MONGODB_URI
					+ " (did you mean " + BootstrapProperties.MONGODB_URI + "?)");
		}
		// An unknown mode gets no Mongo default: the mode error is then the only one reported.
		Optional<DeploymentMode> mode = configuredMode.isEmpty() ? Optional.of(DeploymentMode.DEFAULT)
				: DeploymentMode.parse(configuredMode.get());
		// Any host-style setting (host, username, ...) means the operator describes the server without a URI.
		MongoProperties mongo = binder.bindOrCreate("spring.mongodb", MongoProperties.class);
		if (mode.map(DeploymentMode::mongoUriHasDefault).orElse(false) && mongo.getUri() == null
				&& BootstrapProperties.mongoAddressPropertiesSet(mongo).isEmpty()) {
			defaults.put(BootstrapProperties.MONGODB_URI, DEFAULT_MONGODB_URI);
		}
		if (BootstrapProperties.read(binder, BootstrapProperties.LOG_CORRELATION_PATTERN).isEmpty()) {
			mode.map(DefaultsEnvironmentPostProcessor::logCorrelationPattern)
					.ifPresent(pattern -> defaults.put(BootstrapProperties.LOG_CORRELATION_PATTERN, pattern));
		}

		if (defaults.isEmpty()) {
			return;
		}
		environment.getPropertySources().addLast(new MapPropertySource(PROPERTY_SOURCE_NAME, defaults));
		defaults.forEach((name, value) -> log.info(name + " = " + value + " (default)"));
	}

	private static String logCorrelationPattern(DeploymentMode mode) {
		return switch (mode) {
			case SELF_HOST -> SELF_HOST_LOG_CORRELATION_PATTERN;
			case CLOUD -> CLOUD_LOG_CORRELATION_PATTERN;
		};
	}

	@Override
	public int getOrder() {
		// After ConfigDataEnvironmentPostProcessor, so application.yml has been loaded.
		return Ordered.LOWEST_PRECEDENCE;
	}

}
