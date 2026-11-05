package io.opencelium.core.setup.files;

import java.util.LinkedHashMap;
import java.util.Map;

import org.yaml.snakeyaml.DumperOptions;
import org.yaml.snakeyaml.Yaml;

import io.opencelium.core.config.OpenCeliumProperties;

/**
 * The text of application.yml from the bootstrap values, under the property names the application binds. SnakeYAML
 * writes the values, so a path that YAML would misread (a colon and a space, a hash) comes out quoted. The header
 * line is fixed text and the file has no timestamp: two runs with the same answers give the same bytes. The MongoDB
 * URI goes to {@code spring.mongodb.uri} as the step left it: a password that the env file holds is the
 * placeholder, which Spring resolves from the environment.
 */
public final class YmlRenderer {

	static final String HEADER = "# Written by OpenCelium setup. To run the setup again: java -jar oc-app.jar setup";

	private YmlRenderer() {
	}

	public static String render(BootstrapValues values) {
		var opencelium = new LinkedHashMap<String, Object>();
		opencelium.put(leaf(OpenCeliumProperties.DEPLOYMENT_MODE), values.deploymentMode().propertyValue());
		opencelium.put(leaf(OpenCeliumProperties.DATA_DIR), values.dataDir().toString());
		var root = new LinkedHashMap<String, Object>();
		root.put("server", Map.of("port", values.port()));
		root.put("spring", Map.of("mongodb", Map.of("uri", values.mongoUri())));
		root.put(prefix(OpenCeliumProperties.DATA_DIR), opencelium);
		var options = new DumperOptions();
		options.setDefaultFlowStyle(DumperOptions.FlowStyle.BLOCK);
		return HEADER + "\n" + new Yaml(options).dump(root);
	}

	/** {@code opencelium} of {@code opencelium.data-dir}. */
	private static String prefix(String property) {
		return property.substring(0, property.indexOf('.'));
	}

	/** {@code data-dir} of {@code opencelium.data-dir}. */
	private static String leaf(String property) {
		return property.substring(property.indexOf('.') + 1);
	}

}
