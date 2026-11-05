package io.opencelium.core.setup.mongo;

import java.util.Objects;
import java.util.Optional;

/**
 * Takes the password out of a MongoDB URI, so that the env file holds it and application.yml holds only the
 * placeholder {@code ${OC_MONGO_PASSWORD}}, which Spring resolves from the environment. The password is moved as it
 * is written, URL-encoding included, so the URI with the placeholder resolved is exactly the URI that the user typed.
 * The user information is found as the driver finds it: after the scheme, up to the last {@code @} before the first
 * {@code /} or {@code ?}; the password is what follows the first {@code :} in it. A URI without a password, or with
 * an empty one, stays as it is.
 */
public final class UriSplitter {

	/** The variable of the env file that holds the database password. */
	public static final String PASSWORD_VARIABLE = "OC_MONGO_PASSWORD";

	private static final String PLACEHOLDER = "${" + PASSWORD_VARIABLE + "}";

	private static final String SCHEME_END = "://";

	private UriSplitter() {
	}

	public static SplitUri split(String uri) {
		int hostsStart = uri.indexOf(SCHEME_END);
		if (hostsStart < 0) {
			return new SplitUri(uri, Optional.empty());
		}
		hostsStart += SCHEME_END.length();
		int hostsEnd = firstOf(uri, hostsStart, '/', '?');
		int at = uri.lastIndexOf('@', hostsEnd - 1);
		if (at < hostsStart) {
			return new SplitUri(uri, Optional.empty());
		}
		int colon = uri.indexOf(':', hostsStart);
		if (colon < 0 || colon > at || colon + 1 == at) {
			return new SplitUri(uri, Optional.empty());
		}
		String password = uri.substring(colon + 1, at);
		return new SplitUri(uri.substring(0, colon + 1) + PLACEHOLDER + uri.substring(at), Optional.of(password));
	}

	/** The index of the first of {@code chars} at or after {@code from}, else the length of {@code text}. */
	private static int firstOf(String text, int from, char... chars) {
		int first = text.length();
		for (char c : chars) {
			int index = text.indexOf(c, from);
			if (index >= 0 && index < first) {
				first = index;
			}
		}
		return first;
	}

	/**
	 * @param uri      the URI for application.yml: with the placeholder when the URI had a password
	 * @param password the password for the env file, as written in the URI; empty when the URI has none
	 */
	public record SplitUri(String uri, Optional<String> password) {

		public SplitUri {
			Objects.requireNonNull(uri, "uri");
			Objects.requireNonNull(password, "password");
		}

		/** Without the password: {@link Record#toString()} would print it. */
		@Override
		public String toString() {
			return "SplitUri[" + uri + ", password=" + (password.isPresent() ? "****" : "none") + "]";
		}

	}

}
