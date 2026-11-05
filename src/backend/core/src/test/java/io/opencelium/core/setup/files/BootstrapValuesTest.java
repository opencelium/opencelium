package io.opencelium.core.setup.files;

import java.nio.file.Path;

import org.junit.jupiter.api.Test;

import io.opencelium.core.config.DeploymentMode;

import static org.assertj.core.api.Assertions.assertThat;

/** The bootstrap values hold the MongoDB URI with its password when the user keeps it in plain text. */
class BootstrapValuesTest {

	@Test
	void toStringNeverShowsThePassword() {
		var values = new BootstrapValues(DeploymentMode.SELF_HOST, Path.of("/srv/oc"), 9090,
				"mongodb://oc:s3cret@db.example/opencelium");

		assertThat(values.toString()).doesNotContain("s3cret").contains("mongodb://oc:****@db.example/opencelium")
				.contains("port=9090");
	}

}
