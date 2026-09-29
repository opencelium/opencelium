package io.opencelium.core.secrets.keys;

/** Where the root key came from. {@link RootKeyResolver} tries the sources in this order; the first hit wins. */
public enum RootKeySource {

	/** The {@code OC_MASTER_KEY} environment variable. */
	ENV,

	/** The file named by {@code opencelium.master-key-file}. */
	FILE,

	/** {@code <data-dir>/master.key}, generated at an earlier start or put there by the operator. */
	DATA_DIR,

	/** Generated at this start into {@code <data-dir>/master.key}: a fresh install. */
	GENERATED

}
