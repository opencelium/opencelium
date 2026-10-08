package io.opencelium.core.testsupport;

import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.env.SystemEnvironmentPropertySource;

import io.opencelium.core.CoreApplication;
import io.opencelium.core.config.BootstrapProperties;
import io.opencelium.core.config.OpenCeliumProperties;

/**
 * Starts the real application in-process, as {@code java -jar} would, without a web server. The operating system's
 * environment variables are replaced by the given ones, so a variable in the developer's shell (for example
 * {@code OC_MASTER_KEY}) cannot change the outcome. Close the returned context.
 * <p>
 * {@link #run(Map, Path, String...)} adds the data directory argument that every start needs, so a generated master
 * key never lands in the working tree. {@link #mongoUri(String)} and {@link #arg(String, String)} build the others.
 */
public final class CoreStartup {

	private CoreStartup() {
	}

	public static ConfigurableApplicationContext run(Map<String, String> environmentVariables, Path dataDir,
			String... moreArgs) {
		String[] args = new String[moreArgs.length + 1];
		args[0] = arg(OpenCeliumProperties.DATA_DIR, dataDir.toString());
		System.arraycopy(moreArgs, 0, args, 1, moreArgs.length);
		return run(environmentVariables, args);
	}

	public static ConfigurableApplicationContext run(Map<String, String> environmentVariables, String... args) {
		var application = new SpringApplication(CoreApplication.class);
		application.setWebApplicationType(WebApplicationType.NONE);
		application.setEnvironment(new FixedVariablesEnvironment(environmentVariables));
		return application.run(args);
	}

	/** {@code --spring.mongodb.uri=<uri>}. */
	public static String mongoUri(String uri) {
		return arg(BootstrapProperties.MONGODB_URI, uri);
	}

	/** {@code --<property>=<value>}, the command line form Spring Boot reads. */
	public static String arg(String property, String value) {
		return "--" + property + "=" + value;
	}

	private static final class FixedVariablesEnvironment extends StandardEnvironment {

		private final Map<String, Object> variables;

		FixedVariablesEnvironment(Map<String, String> variables) {
			this.variables = Map.copyOf(new HashMap<String, Object>(variables));
			getPropertySources().replace(SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME,
					new SystemEnvironmentPropertySource(SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME, this.variables));
		}

		@Override
		public Map<String, Object> getSystemEnvironment() {
			// The superclass constructor asks before the field is set; the property source is replaced right after.
			return variables != null ? variables : Map.of();
		}

	}

}
