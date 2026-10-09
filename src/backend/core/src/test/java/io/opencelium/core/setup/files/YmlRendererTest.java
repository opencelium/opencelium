package io.opencelium.core.setup.files;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.core.env.PropertySource;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.io.ByteArrayResource;

import io.opencelium.core.config.DeploymentMode;
import io.opencelium.core.config.OpenCeliumProperties;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The text of application.yml: a fixed header line, then the bootstrap values in the spelling Boot reads. Loaded
 * back by Boot's own YAML loader, the values bind to the same {@link OpenCeliumProperties} the application uses.
 */
class YmlRendererTest {

	@TempDir
	Path tmp;

	@Test
	void renderWritesFixedHeaderLine() {
		String yml = YmlRenderer.render(new BootstrapValues(DeploymentMode.SELF_HOST, Path.of("/srv/oc/data"), 9090));

		assertThat(yml)
				.startsWith("# Written by OpenCelium setup. To run the setup again: java -jar oc-app.jar setup\n");
	}

	@Test
	void renderWritesBlockStyleWithTwoSpaceIndent() {
		String yml = YmlRenderer.render(new BootstrapValues(DeploymentMode.SELF_HOST, Path.of("/srv/oc/data"), 9090));

		assertThat(yml).isEqualTo("""
				# Written by OpenCelium setup. To run the setup again: java -jar oc-app.jar setup
				server:
				  port: 9090
				opencelium:
				  deployment-mode: self-host
				  data-dir: /srv/oc/data
				""");
	}

	@Test
	void renderBindsToOpenCeliumPropertiesWhenLoadedByBoot() throws IOException {
		Path dataDir = tmp.resolve("data");

		StandardEnvironment environment = loaded(YmlRenderer.render(
				new BootstrapValues(DeploymentMode.SELF_HOST, dataDir, 9090)));

		OpenCeliumProperties properties = OpenCeliumProperties.from(environment);
		assertThat(properties.deploymentMode()).isEqualTo(DeploymentMode.SELF_HOST);
		assertThat(properties.dataDir()).isEqualTo(dataDir);
		assertThat(properties.masterKeyFile()).isEmpty();
	}

	@Test
	void renderBindsServerPort() throws IOException {
		StandardEnvironment environment = loaded(YmlRenderer.render(
				new BootstrapValues(DeploymentMode.SELF_HOST, tmp, 9091)));

		assertThat(environment.getProperty("server.port", Integer.class)).isEqualTo(9091);
	}

	@Test
	void renderUsesYmlSpellingOfMode() {
		assertThat(YmlRenderer.render(new BootstrapValues(DeploymentMode.SELF_HOST, tmp, 9090)))
				.contains("deployment-mode: self-host");
		assertThat(YmlRenderer.render(new BootstrapValues(DeploymentMode.CLOUD, tmp, 9090)))
				.contains("deployment-mode: cloud");
	}

	@Test
	void renderWritesNoMongoUri() {
		String yml = YmlRenderer.render(new BootstrapValues(DeploymentMode.SELF_HOST, tmp, 9090));

		assertThat(yml).doesNotContain("mongodb");
	}

	@Test
	void renderQuotesDataDirThatYamlWouldMisread() throws IOException {
		Path dataDir = tmp.resolve("oc #1: data");

		StandardEnvironment environment = loaded(YmlRenderer.render(
				new BootstrapValues(DeploymentMode.SELF_HOST, dataDir, 9090)));

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
