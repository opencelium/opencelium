package io.opencelium.buildrules;

import org.springframework.data.mongodb.core.mapping.Document;

/** Breaks the rule for the secret fields: a document embeds a login that keeps a password as text. */
@Document("samples")
record EmbeddedPasswordDocument(String id, Login login) {

	record Login(String username, String password) {

	}

}
