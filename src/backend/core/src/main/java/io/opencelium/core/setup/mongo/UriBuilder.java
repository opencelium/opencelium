package io.opencelium.core.setup.mongo;

/**
 * Builds the MongoDB URI from the values that the user types one by one. A database username and a database
 * password can hold each character, so the builder writes the characters that have a meaning in a URI in
 * percent-encoding: {@code @ : / ? # [ ] %} and the space. It does the same with {@code $}, because the start reads
 * <code>${</code> in a URI as a placeholder and stops when the placeholder has no value. Each other character stays
 * as typed, also the plus sign, which the MongoDB driver does not read as a space in a database login. Thus the URI
 * stays close to the typed text, and a person who changes it by hand follows the same short rule. The other values
 * go into the URI as typed. The builder checks nothing: the question of each value checks its answer, and the URI
 * rules of the start check the URI that the builder gives.
 */
public final class UriBuilder {

	private UriBuilder() {
	}

	/**
	 * @param host             a host name or an IP address; an IPv6 address in square brackets
	 * @param port             the port as typed
	 * @param database         the database that OpenCelium uses: the path of the URI
	 * @param databaseUsername empty when the server needs no database login; the URI then has no database login and
	 *                         no {@code authSource}
	 * @param databasePassword the database password as typed; not empty when a database username is given
	 * @param authSource       the database that holds the database user
	 * @return the URI, for example {@code mongodb://oc:p%40ss@db.example:27017/opencelium?authSource=admin}
	 */
	public static String build(String host, String port, String database, String databaseUsername,
			String databasePassword, String authSource) {
		throw new UnsupportedOperationException("Not implemented yet.");
	}

}
