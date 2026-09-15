package io.opencelium.core;

import io.opencelium.core.testutil.TestKeys;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@SpringBootTest
@ActiveProfiles("test")
class CoreApplicationTest {

	/** Keys are generated per run: no key literal belongs in the repository. */
	@DynamicPropertySource
	static void keys(DynamicPropertyRegistry registry) {
		registry.add("opencelium.security.master-key", TestKeys::base64Aes256);
		registry.add("opencelium.auth.jwt.signing-key", TestKeys::base64Aes256);
	}

	@Test
	void contextLoads() {
	}

}
