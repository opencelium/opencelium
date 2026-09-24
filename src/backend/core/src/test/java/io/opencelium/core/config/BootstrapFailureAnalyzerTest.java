package io.opencelium.core.config;

import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.diagnostics.FailureAnalysis;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;

import io.opencelium.core.CoreApplication;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@ExtendWith(OutputCaptureExtension.class)
class BootstrapFailureAnalyzerTest {

	@TempDir
	Path tmp;

	@Test
	void descriptionEndsWithThePropertyName() {
		var failure = new BeanCreationException("openCeliumProperties",
				new BootstrapPropertyException("opencelium.deployment-mode", "'cloud' is not a deployment mode."));

		FailureAnalysis analysis = new BootstrapFailureAnalyzer().analyze(failure);

		assertThat(analysis.getDescription()).startsWith("'cloud' is not a deployment mode.")
				.endsWith("Property: opencelium.deployment-mode");
		assertThat(analysis.getAction()).contains("application.yml").contains("OPENCELIUM_DEPLOYMENTMODE");
	}

	@Test
	void exceptionSpecificActionReplacesTheDefault() {
		var failure = new BootstrapPropertyException("spring.mongodb.username", "conflict", "Remove it.", null);

		assertThat(new BootstrapFailureAnalyzer().analyze(failure).getAction()).isEqualTo("Remove it.");
	}

	@Test
	void environmentVariableFollowsSpringRelaxedBinding() {
		assertThat(BootstrapFailureAnalyzer.environmentVariable("spring.mongodb.uri")).isEqualTo("SPRING_MONGODB_URI");
		assertThat(BootstrapFailureAnalyzer.environmentVariable("opencelium.master-key-file"))
				.isEqualTo("OPENCELIUM_MASTERKEYFILE");
	}

	@Test
	void realStartupReportsThePropertyThroughTheRegisteredAnalyzer(CapturedOutput output) {
		assertThatThrownBy(() -> SpringApplication.run(CoreApplication.class,
				"--spring.main.web-application-type=none",
				"--opencelium.data-dir=" + tmp,
				"--opencelium.deployment-mode=cloud")).isNotNull();

		assertThat(output).contains("APPLICATION FAILED TO START").contains("Property: opencelium.deployment-mode");
	}

}
