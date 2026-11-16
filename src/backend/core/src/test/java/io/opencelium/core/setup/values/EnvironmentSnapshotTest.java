package io.opencelium.core.setup.values;

import java.util.LinkedHashMap;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.core.env.AbstractEnvironment;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.env.SystemEnvironmentPropertySource;

import io.opencelium.core.config.OpenCeliumProperties;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The environment snapshot: the bootstrap values that the environment variables of the setup give, with the name of
 * each variable. It reads the names with the rules of the start, so the setup and the start read 1 value from 1
 * variable. A system property never counts: the setup takes a bootstrap value from an environment variable only.
 */
class EnvironmentSnapshotTest {

	@Test
	void namesListsEachBootstrapVariableWhenTheEnvironmentHasIt() {
		var variables = new LinkedHashMap<String, String>();
		variables.put("PATH", "/usr/bin");
		variables.put("OC_MASTER_KEY", "bm90IGEga2V5");
		variables.put("OPENCELIUM_DEPLOYMENTMODE", "self-host");
		variables.put("SPRING_MONGODB_URI", "mongodb://db.example/opencelium");
		variables.put("SERVER_PORT", "8080");
		variables.put("OC_MONGO_URI", "mongodb://db.example/opencelium");
		variables.put("OPENCELIUM_MASTERKEYFILE", "/keys/master.key");
		variables.put("SPRING_MONGODB_DATABASE", "oc");
		variables.put("OPENCELIUM_DATADIR", "/srv/oc");
		variables.put("OPENCELIUM_UNKNOWN", "x");
		variables.put("OC_OTHER", "x");

		// The order of the values on the first screen: data directory, port, MongoDB, key file, master key, mode.
		assertThat(new EnvironmentSnapshot(variables).names()).containsExactly("OPENCELIUM_DATADIR", "SERVER_PORT",
				"SPRING_MONGODB_DATABASE", "SPRING_MONGODB_URI", "OC_MONGO_URI", "OPENCELIUM_MASTERKEYFILE",
				"OC_MASTER_KEY", "OPENCELIUM_DEPLOYMENTMODE");
		assertThat(new EnvironmentSnapshot(Map.of("PATH", "/usr/bin", "HOME", "/home/oc")).names()).isEmpty();
	}

	@Test
	void valueGivesTheSameValueAsTheStartWhenTheVariableUsesTheSpringName() {
		// The canonical name and the form with the dash as an underscore: the start accepts both.
		for (String variable : new String[] {"OPENCELIUM_DATADIR", "OPENCELIUM_DATA_DIR"}) {
			Map<String, String> variables = Map.of(variable, "oc-data/../oc-data", "SERVER_PORT", "08080",
					"OPENCELIUM_DEPLOYMENTMODE", "self-host");
			var snapshot = new EnvironmentSnapshot(variables);
			AbstractEnvironment start = startEnvironment(variables);

			assertThat(snapshot.value(OpenCeliumProperties.DATA_DIR)).hasValueSatisfying(value -> {
				assertThat(value.variable()).isEqualTo(variable);
				// The start makes the path absolute and does not expand ~; the value is that path.
				assertThat(value.text()).isEqualTo(OpenCeliumProperties.from(start).dataDir().toString());
			});
			assertThat(snapshot.value("server.port")).hasValueSatisfying(value -> {
				assertThat(value.variable()).isEqualTo("SERVER_PORT");
				assertThat(value.text()).isEqualTo(start.getProperty("server.port", Integer.class).toString());
			});
		}
	}

	@Test
	void valueGivesTheTextAsWrittenWhenTheStartCannotReadTheVariable() {
		// The check of a typed answer then names the problem, as for a typed port or a typed path.
		var snapshot = new EnvironmentSnapshot(Map.of("SERVER_PORT", "80a", "OPENCELIUM_DATADIR", "/srv/oc\u0000x"));

		assertThat(snapshot.value("server.port")).contains(new EnvironmentSnapshot.Value("SERVER_PORT", "80a"));
		assertThat(snapshot.value(OpenCeliumProperties.DATA_DIR))
				.contains(new EnvironmentSnapshot.Value("OPENCELIUM_DATADIR", "/srv/oc\u0000x"));
		// An empty text: the binder of the start converts it to no number at all.
		assertThat(new EnvironmentSnapshot(Map.of("SERVER_PORT", "")).value("server.port"))
				.contains(new EnvironmentSnapshot.Value("SERVER_PORT", ""));
	}

	@Test
	void valueIgnoresASystemPropertyWhenOnlyTheVariableCounts() {
		String before = System.getProperty("server.port");
		System.setProperty("server.port", "1234");
		try {
			assertThat(new EnvironmentSnapshot(Map.of()).value("server.port")).isEmpty();
			assertThat(new EnvironmentSnapshot(Map.of()).names()).isEmpty();
			assertThat(new EnvironmentSnapshot(Map.of("SERVER_PORT", "8080")).value("server.port"))
					.contains(new EnvironmentSnapshot.Value("SERVER_PORT", "8080"));
		}
		finally {
			if (before == null) {
				System.clearProperty("server.port");
			}
			else {
				System.setProperty("server.port", before);
			}
		}
	}

	/**
	 * An environment as the start has it with these variables and nothing else: the source of the environment
	 * variables under the name that the binder of Spring Boot reads with the name rules of environment variables.
	 */
	private static AbstractEnvironment startEnvironment(Map<String, String> variables) {
		var environment = new AbstractEnvironment() {
		};
		environment.getPropertySources().addFirst(new SystemEnvironmentPropertySource(
				StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME, Map.<String, Object>copyOf(variables)));
		return environment;
	}

}
