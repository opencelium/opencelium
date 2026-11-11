package io.opencelium.core.setup;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * The second half of the setup, after Spring starts on the written files: it finds the admin marker of the wizard,
 * makes the admin and sets the setup state {@code REQUIRED}.
 */
@Component
class SetupCompletionRunner implements ApplicationRunner {

	@Override
	public void run(ApplicationArguments args) {
		// Empty until the implementation: Spring calls each runner at each start, so a throw would stop every start.
	}

}
