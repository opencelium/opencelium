package io.opencelium.core.user;

import java.util.Set;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * A new OpenCelium user of an OIDC login gets the email of the ID token as its username when the IdP verified the
 * email. Else it gets the provider ID, a hyphen and the subject. When an OpenCelium user of the tenant has that
 * username, core adds a hyphen and a number, so that no 2 OpenCelium users have 1 username. The tests do not fix the
 * first number: only its form and that no OpenCelium user has the result.
 */
class OidcUsernameTest {

	private static final String PROVIDER_ID = "kc";

	private static final String SUBJECT = "f3a1c2d4-5b6e-4f70-8a91-b2c3d4e5f607";

	private static final String EMAIL = "alice@example.com";

	@Test
	void ofGivesTheEmailWhenTheEmailIsVerified() {
		String username = OidcUsername.of(PROVIDER_ID, SUBJECT, EMAIL, true, name -> false);

		assertThat(username).isEqualTo(EMAIL);
	}

	@Test
	void ofGivesTheProviderIdAHyphenAndTheSubjectWhenTheEmailIsNotVerified() {
		String username = OidcUsername.of(PROVIDER_ID, SUBJECT, EMAIL, false, name -> false);

		assertThat(username).isEqualTo(PROVIDER_ID + "-" + SUBJECT);
	}

	@Test
	void ofGivesTheProviderIdAHyphenAndTheSubjectWhenTheIdTokenHasNoEmail() {
		String username = OidcUsername.of(PROVIDER_ID, SUBJECT, null, false, name -> false);

		assertThat(username).isEqualTo(PROVIDER_ID + "-" + SUBJECT);
	}

	@Test
	void ofAddsAHyphenAndANumberWhenAnOpenCeliumUserHasTheProviderIdAHyphenAndTheSubjectAsUsername() {
		Set<String> taken = Set.of("kc-alice");

		String username = OidcUsername.of(PROVIDER_ID, "alice", null, false, taken::contains);

		assertThat(username).matches("kc-alice-[0-9]+");
	}

	@Test
	void ofAddsAHyphenAndANumberWhenAnOpenCeliumUserHasTheVerifiedEmailAsUsername() {
		Set<String> taken = Set.of(EMAIL);

		String username = OidcUsername.of(PROVIDER_ID, SUBJECT, EMAIL, true, taken::contains);

		assertThat(username).matches("alice@example\\.com-[0-9]+");
	}

	@Test
	void ofGivesAUsernameThatNoOpenCeliumUserHasWhenUsernamesWithSeveralNumbersExist() {
		Set<String> taken = Set.of("kc-alice", "kc-alice-0", "kc-alice-1", "kc-alice-2", "kc-alice-3", "kc-alice-4",
				"kc-alice-5", "kc-alice-10");

		String username = OidcUsername.of(PROVIDER_ID, "alice", null, false, taken::contains);

		assertThat(username).matches("kc-alice-[0-9]+");
		assertThat(taken).doesNotContain(username);
	}

}
