package io.opencelium.buildrules;

import org.springframework.data.mongodb.core.mapping.Document;

/** Keeps the rule for the secret fields: a mark of the type boolean cannot hold a secret. */
@Document("samples")
record PasswordMarkDocument(String id, boolean generatedPassword) {

}
