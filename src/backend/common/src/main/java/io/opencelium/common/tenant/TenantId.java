package io.opencelium.common.tenant;

import java.util.Objects;

/**
 * Identifies whose data an operation touches (decision #11). Travels in job messages, so it lives in {@code common}.
 *
 * @param value opaque identifier; never blank
 */
public record TenantId(String value) {

	/** The single tenant of a self-hosted installation. */
	public static final TenantId SELF = new TenantId("self");

	/** The platform itself: in saas mode the system database with the tenant catalog. */
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

	@Override
	public String toString() {
		return value;
	}

}
