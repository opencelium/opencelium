package io.opencelium.core.config;

import java.nio.file.Path;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.boot.diagnostics.FailureAnalysis;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;

import io.opencelium.core.testsupport.CoreStartup;

import static io.opencelium.core.config.BootstrapProperties.MONGODB_URI;
import static io.opencelium.core.config.BootstrapProperties.MONGODB_USERNAME;
import static io.opencelium.core.config.OpenCeliumProperties.DEPLOYMENT_MODE;
import static io.opencelium.core.config.OpenCeliumProperties.MASTER_KEY_FILE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@ExtendWith(OutputCaptureExtension.class)
class BootstrapFailureAnalyzerTest {

	@TempDir
	Path tmp;

	@Test
	void descriptionEndsWithThePropertyName() {
		var failure = new BeanCreationException("openCeliumProperties",
				new BootstrapPropertyException(DEPLOYMENT_MODE, "'cloud' is not a deployment mode."));

		FailureAnalysis analysis = new BootstrapFailureAnalyzer().analyze(failure);

		assertThat(analysis.getDescription()).startsWith("'cloud' is not a deployment mode.")
				.endsWith("Property: opencelium.deployment-mode");
		assertThat(analysis.getAction()).contains("application.yml").contains("OPENCELIUM_DEPLOYMENTMODE");
	}

	@Test
	void exceptionSpecificActionReplacesTheDefault() {
		var failure = new BootstrapPropertyException(MONGODB_USERNAME, "conflict", "Remove it.", null);

		assertThat(new BootstrapFailureAnalyzer().analyze(failure).getAction()).isEqualTo("Remove it.");
	}

	@Test
	void environmentVariableFollowsSpringRelaxedBinding() {
		assertThat(BootstrapFailureAnalyzer.environmentVariable(MONGODB_URI)).isEqualTo("SPRING_MONGODB_URI");
		assertThat(BootstrapFailureAnalyzer.environmentVariable(MASTER_KEY_FILE))
				.isEqualTo("OPENCELIUM_MASTERKEYFILE");
	}

	@Test
	void realStartupReportsThePropertyThroughTheRegisteredAnalyzer(CapturedOutput output) {
		String badMode = CoreStartup.arg(DEPLOYMENT_MODE, "cloud");
		assertThatThrownBy(() -> CoreStartup.run(Map.of(), tmp, badMode)).isNotNull();

		assertThat(output).contains("APPLICATION FAILED TO START").contains("Property: opencelium.deployment-mode");
	}

}
