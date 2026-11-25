package io.opencelium.buildrules;

import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Breaks the rule for the secret fields: a document embeds a connection, which embeds a login that keeps a password
 * as text, 2 levels below the document.
 */
@Document("samples")
record DeepPasswordDocument(String id, Connection connection) {

	record Connection(String url, Login login) {

	}

	record Login(String username, String password) {

	}

}
