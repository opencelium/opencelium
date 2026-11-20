package io.opencelium.common.tenant;

import java.util.Objects;
import java.util.regex.Pattern;

/**
 * Identifies whose data an operation touches. Travels in job messages, so it lives in {@code common}: core, the
 * workers and each client check the same form.
 * <p>
 * A tenant ID has 1 to 64 characters: the letters a to z, the digits and the hyphen, and no hyphen first or last. The
 * reserved IDs have this form too. A value from outside core, for example from the Service Portal, goes through
 * {@link #fromOutside}, which also refuses the reserved IDs.
 *
 * @param value the identifier, in the form above
 */
public record TenantId(String value) {

	/** Declared before the reserved IDs, because their construction checks the form. */
	private static final Pattern FORM = Pattern.compile("[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?");

	/**
	 * The single tenant of a self-hosted installation; never a value the Service Portal issues. The value differs on
	 * purpose from the deployment mode value {@code self-host}, so that a stored document or a log line never leaves
	 * open which of the two it names.
	 */
	public static final TenantId SELF_HOST = new TenantId("self-host-tenant");

	/** The platform itself: in cloud mode the system database with the tenant catalog. */
	public static final TenantId SYSTEM = new TenantId("system");

	/**
	 * @throws IllegalArgumentException when the value does not have the form of a tenant ID. The message does not
	 *                                  repeat the value, because a value from outside can hold any character.
	 */
	public TenantId {
		Objects.requireNonNull(value, "value");
		if (!FORM.matcher(value).matches()) {
			throw new IllegalArgumentException("Not a tenant ID: a tenant ID has 1 to 64 characters, each a letter a"
					+ " to z, a digit or a hyphen, and no hyphen first or last.");
		}
	}

	public static TenantId of(String value) {
		return new TenantId(value);
	}

	/**
	 * A tenant ID that core gets from outside, for example from the Service Portal at a login or in a catalog entry.
	 * Only core gives a reserved ID, so a value from outside that names one would reach the data of the self-host
	 * installation or of the installation itself.
	 *
	 * @throws IllegalArgumentException when the value does not have the form of a tenant ID, or is a reserved ID
	 */
	public static TenantId fromOutside(String value) {
		TenantId tenant = of(value);
		if (tenant.isReserved()) {
			throw new IllegalArgumentException("The tenant ID '" + tenant + "' is reserved: only core gives it.");
		}
		return tenant;
	}

	/**
	 * Whether this is {@link #SELF_HOST} or {@link #SYSTEM}: IDs that only core gives, never the Service Portal. No
	 * customer of the cloud mode has such an ID.
	 */
	public boolean isReserved() {
		return equals(SELF_HOST) || equals(SYSTEM);
	}

	@Override
	public String toString() {
		return value;
	}

}
