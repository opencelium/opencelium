package io.opencelium.buildrules;

import org.springframework.data.mongodb.core.mapping.Document;

/** Breaks the rule for the secret fields: a document keeps a password as text. */
@Document("samples")
record PasswordTextDocument(String id, String password) {

}
