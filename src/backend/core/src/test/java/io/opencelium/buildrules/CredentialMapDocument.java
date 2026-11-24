package io.opencelium.buildrules;

import java.util.Map;

import org.springframework.data.mongodb.core.mapping.Document;

/** Breaks the rule for the secret fields: a document keeps credentials as a map of texts. */
@Document("samples")
record CredentialMapDocument(String id, Map<String, String> credentials) {

}
