package io.opencelium.core.secrets.keys;

/** Where the root key came from. {@link RootKeyResolver} tries the sources in this order; the first hit wins. */
public enum RootKeySource {

	/** The {@code OC_MASTER_KEY} environment variable. */
	ENV("environment variable " + RootKeyResolver.ENV_VARIABLE),

	/** The file named by {@code opencelium.master-key-file}. */
	FILE("the file named by opencelium.master-key-file"),

	/** {@code <data-dir>/master.key}, generated at an earlier start or put there by the operator. */
	DATA_DIR("<data-dir>/" + RootKeyResolver.DATA_DIR_FILE_NAME),

	/** Generated at this start into {@code <data-dir>/master.key}: a fresh install. */
	GENERATED("a key generated at this start");

	private final String description;

	RootKeySource(String description) {
		this.description = description;
	}

	/** For messages, for example "environment variable OC_MASTER_KEY". */
	public String description() {
		return description;
	}

}
