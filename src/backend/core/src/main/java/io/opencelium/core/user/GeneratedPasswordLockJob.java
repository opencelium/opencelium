package io.opencelium.core.user;

import java.util.concurrent.TimeUnit;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Every 5 minutes, and once right at startup: locks users whose generated password expired. */
@Component
class GeneratedPasswordLockJob {

	private final UserService users;

	GeneratedPasswordLockJob(UserService users) {
		this.users = users;
	}

	@Scheduled(fixedDelay = 5, timeUnit = TimeUnit.MINUTES)
	void lockExpiredGeneratedPasswords() {
		users.lockExpiredGeneratedPasswords();
	}

}
