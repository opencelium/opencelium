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
 * URI holds a database password, so {@code spring.mongodb.uri} gets only the placeholder of the variable that the
 * env file gives. Spring resolves it from the environment or from the env file, and a different database user or
 * host changes only the env file.
 */
public final class YmlRenderer {

	static final String HEADER = "# Written by OpenCelium setup. To run the setup again: java -jar oc-app.jar setup";

	/** The variable that holds the whole MongoDB URI: the env file gives its value, application.yml refers to it. */
	public static final String MONGO_URI_VARIABLE = "OC_MONGO_URI";

	private YmlRenderer() {
	}

	public static String render(BootstrapValues values) {
		var opencelium = new LinkedHashMap<String, Object>();
		opencelium.put(leaf(OpenCeliumProperties.DEPLOYMENT_MODE), values.deploymentMode().propertyValue());
		opencelium.put(leaf(OpenCeliumProperties.DATA_DIR), values.dataDir().toString());
		var root = new LinkedHashMap<String, Object>();
		root.put("server", Map.of("port", values.port()));
		root.put("spring", Map.of("mongodb", Map.of("uri", "${" + MONGO_URI_VARIABLE + "}")));
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
