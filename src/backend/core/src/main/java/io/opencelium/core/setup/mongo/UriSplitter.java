package io.opencelium.core.setup.mongo;

import java.util.Optional;

/**
 * Takes the password out of a MongoDB URI. Not implemented yet.
 */
public final class UriSplitter {

	public static final String PASSWORD_VARIABLE = "OC_MONGO_PASSWORD";

	private UriSplitter() {
	}

	public static SplitUri split(String uri) {
		throw new UnsupportedOperationException("not implemented yet");
	}

	/**
	 * @param uri      the URI for application.yml
	 * @param password the password for the env file; empty when the URI has none
	 */
	public record SplitUri(String uri, Optional<String> password) {

	}

}
