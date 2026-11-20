package io.opencelium.core.user;

import java.time.Instant;
import java.util.Set;

import org.junit.jupiter.api.Test;

import io.opencelium.common.tenant.TenantId;

import static org.assertj.core.api.Assertions.assertThat;

/** Core keeps the email of a user in lower case, whatever the writer gives, so a login compares it without the case. */
class UserDocumentTest {

	private static final Instant NOW = Instant.parse("2026-11-20T10:00:00Z");

	@Test
	void constructorTurnsTheEmailIntoLowerCaseWhenItHasUpperCaseLetters() {
		var user = new UserDocument(null, TenantId.SELF_HOST.value(), "alice", "Alice.Smith@Example.COM", "{noop}x",
				Set.of(), false, NOW, false, false, NOW);

		assertThat(user.email()).isEqualTo("alice.smith@example.com");
	}

}
