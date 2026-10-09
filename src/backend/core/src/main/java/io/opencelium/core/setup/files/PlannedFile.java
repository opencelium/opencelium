package io.opencelium.core.setup.files;

import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermission;
import java.nio.file.attribute.PosixFilePermissions;
import java.util.Objects;
import java.util.Set;

/**
 * One file the wizard will write: where, what, and who may read it. The configuration file is readable by the
 * group, so a service user can read what root wrote; the env file, which will hold the secrets, is readable by
 * its owner only.
 *
 * @param permissions the POSIX permissions after the write; kept as they are, with a warning, on a file system
 *                    that has none
 */
public record PlannedFile(Path path, String content, Set<PosixFilePermission> permissions) {

	/** {@code rw-------}: the owner only. */
	public static final Set<PosixFilePermission> OWNER_ONLY = Set.copyOf(PosixFilePermissions.fromString("rw-------"));

	/** {@code rw-r-----}: the owner writes, the group reads. */
	public static final Set<PosixFilePermission> GROUP_READABLE = Set.copyOf(
			PosixFilePermissions.fromString("rw-r-----"));

	public PlannedFile {
		Objects.requireNonNull(path, "path");
		Objects.requireNonNull(content, "content");
		permissions = Set.copyOf(permissions);
	}

	public static PlannedFile ownerOnly(Path path, String content) {
		return new PlannedFile(path, content, OWNER_ONLY);
	}

	public static PlannedFile groupReadable(Path path, String content) {
		return new PlannedFile(path, content, GROUP_READABLE);
	}

}
