package io.opencelium.common.tenant;

import java.util.Objects;

/**
 * Identifies whose data an operation touches. Travels in job messages, so it lives in {@code common}.
 *
 * @param value opaque identifier; never blank
 */
public record TenantId(String value) {

	/**
	 * The single tenant of a self-hosted installation; never a value the Service Portal issues. The value differs on
	 * purpose from the deployment mode value {@code self-host}, so that a stored document or a log line never leaves
	 * open which of the two it names.
	 */
	public static final TenantId SELF_HOST = new TenantId("self-host-tenant");

	/** The platform itself: in cloud mode the system database with the tenant catalog. */
	public static final TenantId SYSTEM = new TenantId("system");

	public TenantId {
		Objects.requireNonNull(value, "value");
		if (value.isBlank()) {
			throw new IllegalArgumentException("tenant id must not be blank");
		}
	}

	public static TenantId of(String value) {
		return new TenantId(value);
	}

	/**
	 * Whether this is {@link #SELF_HOST} or {@link #SYSTEM}: IDs that only core gives, never the Service Portal. No
	 * customer of the cloud mode has such an ID.
	 */
	public boolean isReserved() {
		throw new UnsupportedOperationException("not implemented yet");
	}

	@Override
	public String toString() {
		return value;
	}

}
