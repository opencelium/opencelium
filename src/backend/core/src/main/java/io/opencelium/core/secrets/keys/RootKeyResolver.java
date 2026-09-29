package io.opencelium.core.secrets.keys;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.AccessDeniedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.function.BooleanSupplier;
import java.util.function.Function;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import io.opencelium.core.config.BootstrapPropertyException;
import io.opencelium.core.config.OpenCeliumProperties;

/**
 * Finds the root key at startup, in a fixed order where the first hit wins: the {@code OC_MASTER_KEY} environment
 * variable, the file named by {@code opencelium.master-key-file}, {@code <data-dir>/master.key}. When none has a key,
 * a new one is generated into {@code <data-dir>/master.key}, but only on a fresh install: if the database already
 * holds wrapped data keys, a new key could not read them, so startup stops instead. Setting both the variable and the
 * property is an error, not a question of order. Logs the source, never the key.
 */
public final class RootKeyResolver {

	public static final String ENV_VARIABLE = "OC_MASTER_KEY";

	public static final String DATA_DIR_FILE_NAME = "master.key";

	private static final String KEY_FORMAT = "The master key is the base64 of exactly 32 random bytes,"
			+ " for example the output of: openssl rand -base64 32";

	private static final Log log = LogFactory.getLog(RootKeyResolver.class);

	private final Function<String, String> environment;

	private final Optional<Path> masterKeyFile;

	private final Path dataDirFile;

	private final RootKeyGenerator generator;

	/**
	 * @param environment   looks up environment variables ({@code System::getenv} outside Spring)
	 * @param masterKeyFile {@code opencelium.master-key-file}
	 * @param dataDir       the data directory; exists and is writable
	 */
	public RootKeyResolver(Function<String, String> environment, Optional<Path> masterKeyFile, Path dataDir,
			RootKeyGenerator generator) {
		this.environment = environment;
		this.masterKeyFile = masterKeyFile;
		this.dataDirFile = dataDir.resolve(DATA_DIR_FILE_NAME);
		this.generator = generator;
	}

	/**
	 * @param wrappedDeksExist asked only when no source has a key: whether the database holds wrapped data keys
	 * @throws BootstrapPropertyException when both sources are set, or a key is missing or malformed
	 * @throws KeyStartupException        when no source has a key and the database holds wrapped data keys
	 */
	public RootKey resolve(BooleanSupplier wrappedDeksExist) {
		Optional<RootKey> found = load();
		if (found.isPresent()) {
			RootKey key = found.get();
			log.info("Master key loaded from " + location(key.source()) + " (key id " + key.id() + ")");
			return key;
		}
		if (wrappedDeksExist.getAsBoolean()) {
			throw KeyStartupException.restoreOrReset("No master key was found: " + ENV_VARIABLE + " is not set, "
					+ OpenCeliumProperties.MASTER_KEY_FILE + " is not set, and " + dataDirFile + " does not exist."
					+ " The database already holds encrypted data keys, so no new key is generated.");
		}
		RootKey key = generate();
		log.warn(backupWarning(dataDirFile));
		return key;
	}

	private Optional<RootKey> load() {
		String fromEnvironment = environment.apply(ENV_VARIABLE);
		if (fromEnvironment != null && masterKeyFile.isPresent()) {
			throw new BootstrapPropertyException(OpenCeliumProperties.MASTER_KEY_FILE,
					"Both " + ENV_VARIABLE + " and " + OpenCeliumProperties.MASTER_KEY_FILE + " are set;"
							+ " the master key must come from exactly one of them.",
					"Unset " + ENV_VARIABLE + " or remove " + OpenCeliumProperties.MASTER_KEY_FILE + ", then start again.",
					null);
		}
		if (fromEnvironment != null) {
			return Optional.of(fromEnvironment(fromEnvironment));
		}
		if (masterKeyFile.isPresent()) {
			return Optional.of(fromFile(masterKeyFile.get(), RootKeySource.FILE, OpenCeliumProperties.MASTER_KEY_FILE,
					"Point " + OpenCeliumProperties.MASTER_KEY_FILE + " at the master key file, then start again. "
							+ KEY_FORMAT));
		}
		if (Files.exists(dataDirFile)) {
			return Optional.of(fromFile(dataDirFile, RootKeySource.DATA_DIR, OpenCeliumProperties.DATA_DIR,
					"Restore " + dataDirFile + " from your backup, then start again. Only on a fresh install without"
							+ " stored secrets may you delete it instead, so that a new key is generated."));
		}
		return Optional.empty();
	}

	private static RootKey fromEnvironment(String value) {
		try {
			byte[] material = decode(value.getBytes(StandardCharsets.US_ASCII), ENV_VARIABLE);
			return new RootKey(RootKey.INITIAL_ID, RootKeySource.ENV, material);
		}
		catch (IllegalArgumentException ex) {
			throw new BootstrapPropertyException(ENV_VARIABLE, ex.getMessage() + ".",
					"Set " + ENV_VARIABLE + " to the original master key, or unset it. " + KEY_FORMAT, null);
		}
	}

	private static RootKey fromFile(Path file, RootKeySource source, String property, String action) {
		if (!Files.isRegularFile(file)) {
			throw new BootstrapPropertyException(property, "Master key file " + file
					+ (Files.exists(file) ? " is not a regular file." : " does not exist."), action, null);
		}
		byte[] text;
		try {
			text = Files.readAllBytes(file);
		}
		catch (IOException ex) {
			throw new BootstrapPropertyException(property, "Master key file " + file + (ex instanceof AccessDeniedException
					? " cannot be read by this user." : " cannot be read: " + ex + "."), action, ex);
		}
		try {
			return new RootKey(RootKey.INITIAL_ID, source, decode(text, "Master key file " + file));
		}
		catch (IllegalArgumentException ex) {
			throw new BootstrapPropertyException(property, ex.getMessage() + ".", action, null);
		}
		finally {
			Arrays.fill(text, (byte) 0);
		}
	}

	/**
	 * Decodes the text form: standard base64 of exactly 32 bytes, as {@code openssl rand -base64 32} prints it,
	 * ignoring surrounding whitespace such as a trailing newline in a file. Errors never quote the input.
	 *
	 * @param what names the input in the error message, for example "OC_MASTER_KEY"
	 * @throws IllegalArgumentException when the input is empty, not base64, or not 32 bytes long
	 */
	private static byte[] decode(byte[] text, String what) {
		byte[] trimmed = strip(text);
		try {
			if (trimmed.length == 0) {
				throw new IllegalArgumentException(what + " is empty");
			}
			byte[] key;
			try {
				key = Base64.getDecoder().decode(trimmed);
			}
			catch (IllegalArgumentException ex) {
				// Not attached as cause: the decoder's message quotes the offending character.
				throw new IllegalArgumentException(what + " is not valid base64");
			}
			if (key.length != RootKey.LENGTH) {
				Arrays.fill(key, (byte) 0);
				throw new IllegalArgumentException(
						what + " decodes to " + key.length + " bytes, expected " + RootKey.LENGTH);
			}
			return key;
		}
		finally {
			Arrays.fill(trimmed, (byte) 0);
		}
	}

	private static byte[] strip(byte[] text) {
		int from = 0;
		int to = text.length;
		while (from < to && Character.isWhitespace(text[from])) {
			from++;
		}
		while (to > from && Character.isWhitespace(text[to - 1])) {
			to--;
		}
		return Arrays.copyOfRange(text, from, to);
	}

	private RootKey generate() {
		try {
			return generator.generate(dataDirFile);
		}
		catch (IOException ex) {
			throw new BootstrapPropertyException(OpenCeliumProperties.DATA_DIR,
					"Cannot write a new master key to " + dataDirFile + ": " + ex + ".", ex);
		}
	}

	private String location(RootKeySource source) {
		return switch (source) {
			case ENV -> "environment variable " + ENV_VARIABLE;
			case FILE -> masterKeyFile.orElseThrow() + " (" + OpenCeliumProperties.MASTER_KEY_FILE + ")";
			case DATA_DIR, GENERATED -> dataDirFile.toString();
		};
	}

	/** The path goes above the box: a long one would make the box wider than the terminal. */
	private static String backupWarning(Path file) {
		List<String> lines = List.of(
				"BACK UP THIS FILE NOW, and keep the copy off this server.",
				"It decrypts every secret OpenCelium stores. If it is lost,",
				"the secrets are lost too: a new key cannot read them.");
		int width = lines.stream().mapToInt(String::length).max().orElseThrow();
		String border = "+" + "-".repeat(width + 2) + "+";
		var box = new StringBuilder("A new master key was generated: ").append(file).append('\n').append(border)
				.append('\n');
		lines.forEach(line -> box.append("| ").append(line).append(" ".repeat(width - line.length())).append(" |\n"));
		return box.append(border).toString();
	}

}
