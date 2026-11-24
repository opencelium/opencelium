package io.opencelium.common.secret;

import io.opencelium.common.tenant.TenantId;

/**
 * Keeps, gives and deletes secrets. A secret is a value that gives access to something, for example a password or an
 * API token. The storage behind the provider encrypts each secret; no other code holds a secret except at the moment
 * of use. The bytes of a plaintext are the caller's: the caller zeroes them after use.
 */
public interface SecretProvider {

	/**
	 * Encrypts and keeps a new secret.
	 *
	 * @param owner     the owner of the secret
	 * @param plaintext the value; the provider does not keep the array, and the caller zeroes it
	 * @return the reference of the new secret
	 */
	SecretReference store(TenantId owner, byte[] plaintext);

	/**
	 * Decrypts a secret.
	 *
	 * @return a new array with the value; the caller zeroes it after use
	 */
	byte[] read(SecretReference reference);

	/** Deletes a secret. A reference that names no secret changes nothing. */
	void delete(SecretReference reference);

}
