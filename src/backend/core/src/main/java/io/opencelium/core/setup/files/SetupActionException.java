package io.opencelium.core.setup.files;

/**
 * An action of the plan failed. The message names the action and the cause in plain words and never holds a
 * secret, because the setup prints it on standard error.
 */
public final class SetupActionException extends RuntimeException {

	public SetupActionException(String message) {
		super(message);
	}

}
