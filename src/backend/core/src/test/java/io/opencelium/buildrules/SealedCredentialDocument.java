package io.opencelium.buildrules;

import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Breaks the rule for the secret fields: the field has a sealed type, and Spring Data stores the fields of the
 * permitted subclass, which keeps a password as text.
 */
@Document("samples")
record SealedCredentialDocument(String id, Credential credential) {

	sealed interface Credential permits Basic {

	}

	record Basic(String username, String password) implements Credential {

	}

}
