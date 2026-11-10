package io.opencelium.core.setup.files;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.PropertySource;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.io.ByteArrayResource;

import io.opencelium.core.config.BootstrapProperties;
import io.opencelium.core.config.DeploymentMode;
import io.opencelium.core.config.OpenCeliumProperties;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The text of application.yml: a fixed header line, then the bootstrap values in the spelling Boot reads. Loaded
 * back by Boot's own YAML loader, the values bind to the same {@link OpenCeliumProperties} the application uses, and
 * the MongoDB URI is the placeholder of the variable that the env file gives.
 */
class YmlRendererTest {

	private static final String URI = "mongodb://localhost:27017/opencelium";

	@TempDir
	Path tmp;

	@Test
	void renderWritesFixedHeaderLine() {
		String yml = YmlRenderer.render(
				new BootstrapValues(DeploymentMode.SELF_HOST, Path.of("/srv/oc/data"), 9090, URI));

		assertThat(yml)
				.startsWith("# Written by OpenCelium setup. To run the setup again: java -jar oc-app.jar setup\n");
	}

	@Test
	void renderWritesBlockStyleWithTwoSpaceIndent() {
		String yml = YmlRenderer.render(
				new BootstrapValues(DeploymentMode.SELF_HOST, Path.of("/srv/oc/data"), 9090, URI));

		assertThat(yml).isEqualTo("""
				# Written by OpenCelium setup. To run the setup again: java -jar oc-app.jar setup
				server:
				  port: 9090
				spring:
				  mongodb:
				    uri: ${OC_MONGO_URI}
				opencelium:
				  deployment-mode: self-host
				  data-dir: /srv/oc/data
				""");
	}

	@Test
	void renderBindsToOpenCeliumPropertiesWhenLoadedByBoot() throws IOException {
		Path dataDir = tmp.resolve("data");

		StandardEnvironment environment = loaded(YmlRenderer.render(
				new BootstrapValues(DeploymentMode.SELF_HOST, dataDir, 9090, URI)));

		OpenCeliumProperties properties = OpenCeliumProperties.from(environment);
		assertThat(properties.deploymentMode()).isEqualTo(DeploymentMode.SELF_HOST);
		assertThat(properties.dataDir()).isEqualTo(dataDir);
		assertThat(properties.masterKeyFile()).isEmpty();
	}

	@Test
	void renderBindsServerPort() throws IOException {
		StandardEnvironment environment = loaded(YmlRenderer.render(
				new BootstrapValues(DeploymentMode.SELF_HOST, tmp, 9091, URI)));

		assertThat(environment.getProperty("server.port", Integer.class)).isEqualTo(9091);
	}

	@Test
	void renderUsesYmlSpellingOfMode() {
		assertThat(YmlRenderer.render(new BootstrapValues(DeploymentMode.SELF_HOST, tmp, 9090, URI)))
				.contains("deployment-mode: self-host");
		assertThat(YmlRenderer.render(new BootstrapValues(DeploymentMode.CLOUD, tmp, 9090, URI)))
				.contains("deployment-mode: cloud");
	}

	@Test
	void renderWritesTheUriPlaceholder() throws IOException {
		String uri = "mongodb://oc:s3cret@db.example:27017/opencelium?authSource=admin";
		String yml = YmlRenderer.render(new BootstrapValues(DeploymentMode.SELF_HOST, tmp, 9090, uri));
		StandardEnvironment environment = loaded(yml);
		// The variable as the env file gives it to the process.
		environment.getPropertySources().addFirst(new MapPropertySource("env", Map.of("OC_MONGO_URI", uri)));

		assertThat(yml).contains("    uri: ${OC_MONGO_URI}\n").doesNotContain("s3cret").doesNotContain("db.example");
		assertThat(environment.getProperty(BootstrapProperties.MONGODB_URI)).isEqualTo(uri);
	}

	@Test
	void renderQuotesDataDirThatYamlWouldMisread() throws IOException {
		Path dataDir = tmp.resolve("oc #1: data");

		StandardEnvironment environment = loaded(YmlRenderer.render(
				new BootstrapValues(DeploymentMode.SELF_HOST, dataDir, 9090, URI)));

		assertThat(OpenCeliumProperties.from(environment).dataDir()).isEqualTo(dataDir);
	}

	/** The text as Boot loads {@code config/application.yml}: through its YAML property source loader. */
	private static StandardEnvironment loaded(String yml) throws IOException {
		List<PropertySource<?>> sources = new YamlPropertySourceLoader().load("application.yml",
				new ByteArrayResource(yml.getBytes(StandardCharsets.UTF_8)));
		var environment = new StandardEnvironment();
		sources.forEach(environment.getPropertySources()::addFirst);
		return environment;
	}

}
