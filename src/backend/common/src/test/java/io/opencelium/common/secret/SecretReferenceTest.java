package io.opencelium.common.secret;

import org.junit.jupiter.api.Test;

import io.opencelium.common.tenant.TenantId;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * A secret reference names the owner and the ID of a secret, and nothing else: its text form, for example in a log
 * line, shows no value.
 */
class SecretReferenceTest {

	@Test
	void toStringShowsTheOwnerAndTheIdAndNoValueWhenItIsPrinted() {
		var reference = new SecretReference(TenantId.SYSTEM, "secret-1");

		assertEquals("SecretReference[owner=system, id=secret-1]", reference.toString());
	}

}
