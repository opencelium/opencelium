package io.opencelium.core.setup.mongo;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The splitter takes the password out of a MongoDB URI for the env file and leaves the placeholder that Spring
 * resolves from the environment, so that the URI with the placeholder resolved is the URI the user typed.
 */
class UriSplitterTest {

	@Test
	void splitMovesPasswordToEnvFileAndLeavesPlaceholder() {
		UriSplitter.SplitUri split = UriSplitter.split(
				"mongodb://oc:s3cret@db.example:27017/opencelium?authSource=admin");

		assertThat(split.uri())
				.isEqualTo("mongodb://oc:${OC_MONGO_PASSWORD}@db.example:27017/opencelium?authSource=admin");
		assertThat(split.password()).contains("s3cret");
	}

	@Test
	void splitKeepsUriWithoutPasswordUnchanged() {
		for (String uri : new String[] {"mongodb://db.example:27017/opencelium", "mongodb://oc@db.example/opencelium",
				"mongodb+srv://cluster0.example.net/opencelium?retryWrites=true"}) {
			UriSplitter.SplitUri split = UriSplitter.split(uri);

			assertThat(split.uri()).isEqualTo(uri);
			assertThat(split.password()).isEmpty();
		}
	}

	@Test
	void splitKeepsAnEncodedPasswordAsTypedSoThatThePlaceholderGivesTheSameUri() {
		UriSplitter.SplitUri split = UriSplitter.split(
				"mongodb+srv://oc:p%40ss%3Aword@cluster0.example.net/?w=majority");

		assertThat(split.uri()).isEqualTo("mongodb+srv://oc:${OC_MONGO_PASSWORD}@cluster0.example.net/?w=majority");
		assertThat(split.password()).contains("p%40ss%3Aword");
	}

	@Test
	void splitIgnoresAnAtSignInTheOptions() {
		UriSplitter.SplitUri split = UriSplitter.split("mongodb://db.example/opencelium?appName=a@b");

		assertThat(split.uri()).isEqualTo("mongodb://db.example/opencelium?appName=a@b");
		assertThat(split.password()).isEmpty();
	}

}
