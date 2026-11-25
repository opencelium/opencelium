package io.opencelium.buildrules;

import org.springframework.data.mongodb.core.mapping.Document;

/** Breaks the rule for the secret fields: a document inherits a password as text from {@link PasswordBase}. */
@Document("samples")
class InheritedPasswordDocument extends PasswordBase {

	String id;

}
