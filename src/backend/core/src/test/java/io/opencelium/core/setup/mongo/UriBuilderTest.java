package io.opencelium.core.setup.mongo;

import com.mongodb.ConnectionString;
import org.junit.jupiter.api.Test;

import io.opencelium.core.config.mongo.StaticMongoConnectionResolver;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The URI that the setup builds from the values that the user types one by one. The characters of a database login
 * that have a meaning in a URI or for the start are written in percent-encoding, so the MongoDB driver reads the
 * database username and the database password as the user typed them, and the start finds no placeholder. Each
 * other character stays as typed. Without a database username the URI has no database login.
 */
class UriBuilderTest {

	@Test
	void buildEncodesEachSpecialCharacterAndTheSpace() {
		String uri = UriBuilder.build("db.example", "27018", "ocdb", "o@:/?#[]%$ c", "p@:/?#[]%$ w", "users");

		assertThat(uri).isEqualTo("mongodb://o%40%3A%2F%3F%23%5B%5D%25%24%20c:p%40%3A%2F%3F%23%5B%5D%25%24%20w"
				+ "@db.example:27018/ocdb?authSource=users");
		// The driver reads the database login as the user typed it.
		ConnectionString parsed = new ConnectionString(uri);
		assertThat(parsed.getUsername()).isEqualTo("o@:/?#[]%$ c");
		assertThat(new String(parsed.getPassword())).isEqualTo("p@:/?#[]%$ w");
		assertThat(parsed.getHosts()).containsExactly("db.example:27018");
		assertThat(parsed.getDatabase()).isEqualTo("ocdb");
		assertThat(parsed.getCredential().getSource()).isEqualTo("users");
	}

	@Test
	void buildKeepsThePlusSign() {
		String uri = UriBuilder.build("localhost", "27017", "opencelium", "root", "p@ss+w rd", "admin");

		// A plus sign in a database login is a plus sign for the driver, not a space.
		assertThat(uri).isEqualTo("mongodb://root:p%40ss+w%20rd@localhost:27017/opencelium?authSource=admin");
		assertThat(new String(new ConnectionString(uri).getPassword())).isEqualTo("p@ss+w rd");
	}

	@Test
	void buildGivesAUriThatTheStartAcceptsWhenTheDatabasePasswordHasAPlaceholderForm() {
		String uri = UriBuilder.build("db.example", "27018", "ocdb", "oc", "pa${x}ss", "admin");

		// The start refuses a URI with ${, which it reads as a placeholder without a value. The built URI has none.
		assertThat(uri).isEqualTo("mongodb://oc:pa%24{x}ss@db.example:27018/ocdb?authSource=admin");
		ConnectionString accepted = StaticMongoConnectionResolver.parseUri(uri).connectionString();
		assertThat(new String(accepted.getPassword())).isEqualTo("pa${x}ss");
	}

	@Test
	void buildLeavesOutTheLoginAndTheAuthSourceWhenNoDatabaseUsernameIsGiven() {
		String uri = UriBuilder.build("db.example", "27018", "ocdb", "", "", "admin");

		assertThat(uri).isEqualTo("mongodb://db.example:27018/ocdb");
		assertThat(new ConnectionString(uri).getCredential()).isNull();
	}

}
