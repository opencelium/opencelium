package io.opencelium.buildrules;

import org.springframework.data.mongodb.core.mapping.Document;

/** Keeps the rule for the secret fields: a password hash and a token ID hold no secret. */
@Document("samples")
record PasswordHashDocument(String id, String passwordHash, String tokenId) {

}
