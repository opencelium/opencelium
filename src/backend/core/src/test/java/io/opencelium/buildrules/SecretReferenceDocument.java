package io.opencelium.buildrules;

import org.springframework.data.mongodb.core.mapping.Document;

import io.opencelium.common.secret.SecretReference;

/** Keeps the rule for the secret fields: a document keeps the broker password as a secret reference. */
@Document("samples")
record SecretReferenceDocument(String id, SecretReference brokerPassword) {

}
