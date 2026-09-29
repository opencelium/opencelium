package io.opencelium.core.testsupport;

import java.util.HashMap;
import java.util.Map;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.env.SystemEnvironmentPropertySource;

import io.opencelium.core.CoreApplication;

/**
 * Starts the real application in-process, as {@code java -jar} would, without a web server. The operating system's
 * environment variables are replaced by the given ones, so a variable in the developer's shell (for example
 * {@code OC_MASTER_KEY}) cannot change the outcome. Close the returned context.
 */
public final class CoreStartup {

	private CoreStartup() {
	}

	public static ConfigurableApplicationContext run(Map<String, String> environmentVariables, String... args) {
		var application = new SpringApplication(CoreApplication.class);
		application.setWebApplicationType(WebApplicationType.NONE);
		application.setEnvironment(new FixedVariablesEnvironment(environmentVariables));
		return application.run(args);
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
