package io.opencelium.core.secrets.keys;

/**
 * The stored secrets cannot be decrypted at this start: no root key was found for them, the resolved key is not the
 * one that encrypted them, or a stored data key is damaged. Stops startup; {@link KeyStartupFailureAnalyzer} prints
 * the message and the action.
 */
public final class KeyStartupException extends RuntimeException {

	/** The message when the stored secrets cannot be decrypted with the resolved root key. */
	public static final String RESTORE_OR_RESET = "Stored secrets were encrypted with a key this installation no"
			+ " longer has. Restore the original master key, or run an explicit secrets reset.";

	private final String action;

	KeyStartupException(String message, String action) {
		super(message);
		this.action = action;
	}

	static KeyStartupException restoreOrReset(String reason) {
		return new KeyStartupException(RESTORE_OR_RESET + "\n\n" + reason,
				"Start again with the original master key: set " + RootKeyResolver.ENV_VARIABLE
						+ ", point opencelium.master-key-file at the key file, or put the file back as <data-dir>/"
						+ RootKeyResolver.DATA_DIR_FILE_NAME + ". Do not replace it with a new key: a new key cannot"
						+ " read the stored secrets.");
	}

	static KeyStartupException damaged(String reason) {
		return new KeyStartupException(reason, "Restore the 'keys' collection from a database backup, or run an"
				+ " explicit secrets reset.");
	}

	public String action() {
		return action;
	}

}
