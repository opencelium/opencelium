package io.opencelium.core.config;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

import org.apache.commons.logging.Log;
import org.springframework.boot.EnvironmentPostProcessor;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.logging.DeferredLogFactory;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

/**
 * Supplies the documented default for every bootstrap property that has one and was left out, as the
 * lowest-priority property source, and logs one {@code (default)} line per applied default.
 * {@code opencelium.master-key-file} has no default here; the root key resolver has its own lookup order.
 * <p>
 * Lines go through Boot's deferred log, so they appear even when startup fails later (for example when the
 * default MongoDB is not reachable).
 */
public final class DefaultsEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

	public static final String PROPERTY_SOURCE_NAME = "openceliumDefaults";

	static final String MONGODB_URI = "spring.mongodb.uri";

	static final String DEFAULT_MONGODB_URI = "mongodb://localhost:27017/opencelium";

	private static final String MONGODB_HOST = "spring.mongodb.host";

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
			log.warn(BOOT3_MONGODB_URI + " is set but ignored; Spring Boot 4 reads " + MONGODB_URI
					+ " (did you mean " + MONGODB_URI + "?)");
		}
		// An unknown mode gets no Mongo default: the mode error is then the only one reported.
		Optional<DeploymentMode> mode = configuredMode.isEmpty() ? Optional.of(DeploymentMode.DEFAULT)
				: DeploymentMode.parse(configuredMode.get());
		if (mode.map(DeploymentMode::mongoUriHasDefault).orElse(false)
				&& BootstrapProperties.read(binder, MONGODB_URI).isEmpty()
				&& BootstrapProperties.read(binder, MONGODB_HOST).isEmpty()) {
			defaults.put(MONGODB_URI, DEFAULT_MONGODB_URI);
		}

		if (defaults.isEmpty()) {
			return;
		}
		environment.getPropertySources().addLast(new MapPropertySource(PROPERTY_SOURCE_NAME, defaults));
		defaults.forEach((name, value) -> log.info(name + " = " + value + " (default)"));
	}

	@Override
	public int getOrder() {
		// After ConfigDataEnvironmentPostProcessor, so application.yml has been loaded.
		return Ordered.LOWEST_PRECEDENCE;
	}

}
