package io.opencelium.core.secrets.keys;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.nio.file.attribute.PosixFilePermissions;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

/**
 * Generates a root key with {@link SecureRandom} and writes it, base64, to a new file that only its owner can read
 * and write ({@code rw-------}). Never overwrites: an existing file is an error, so a key is never replaced by
 * accident.
 */
public final class RootKeyGenerator {

	private static final Log log = LogFactory.getLog(RootKeyGenerator.class);

	private final SecureRandom random;

	public RootKeyGenerator() {
		this(new SecureRandom());
	}

	RootKeyGenerator(SecureRandom random) {
		this.random = random;
	}

	/**
	 * @throws IOException when {@code file} exists or cannot be written; a partly written file is deleted
	 */
	public RootKey generate(Path file) throws IOException {
		byte[] material = new byte[RootKey.LENGTH];
		random.nextBytes(material);
		byte[] encoded = Base64.getEncoder().encode(material);
		try {
			createOwnerOnly(file);
			try {
				Files.write(file, encoded, StandardOpenOption.WRITE, StandardOpenOption.SYNC);
			}
			catch (IOException ex) {
				Files.deleteIfExists(file);
				throw ex;
			}
		}
		catch (IOException ex) {
			Arrays.fill(material, (byte) 0);
			throw ex;
		}
		finally {
			Arrays.fill(encoded, (byte) 0);
		}
		return new RootKey(RootKey.INITIAL_ID, RootKeySource.GENERATED, material);
	}

	/** Sets the permissions while creating, so the file is never readable by others, not even briefly. */
	private static void createOwnerOnly(Path file) throws IOException {
		try {
			Files.createFile(file, PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rw-------")));
		}
		catch (UnsupportedOperationException ex) {
			// Not a POSIX file system (Windows): the file gets the directory's access rules.
			Files.createFile(file);
			log.warn("Cannot limit " + file + " to its owner on this file system; restrict access to it by hand.");
		}
	}

}
