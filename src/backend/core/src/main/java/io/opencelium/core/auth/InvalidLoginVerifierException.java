package io.opencelium.core.auth;

/**
 * An exchange of a login code with a login verifier whose hash is not the hash that the login code holds: the HTTP
 * client did not start the login of the login code. The login code stays valid.
 */
final class InvalidLoginVerifierException extends RuntimeException {

}
