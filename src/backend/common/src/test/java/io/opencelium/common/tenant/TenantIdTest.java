package io.opencelium.common.tenant;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TenantIdTest {

	@Test
	void wellKnownTenantsAreDistinct() {
		assertNotEquals(TenantId.SELF_HOST, TenantId.SYSTEM);
		assertEquals("self-host-tenant", TenantId.SELF_HOST.value());
		assertEquals("system", TenantId.SYSTEM.value());
	}

	@Test
	void equalValuesAreEqualTenants() {
		assertEquals(TenantId.of("acme"), TenantId.of("acme"));
	}

	@Test
	void blankOrNullIsRejected() {
		assertThrows(NullPointerException.class, () -> TenantId.of(null));
		assertThrows(IllegalArgumentException.class, () -> TenantId.of(" "));
	}

	@Test
	void isReservedIsTrueWhenTheValueIsSelfHostTenantOrSystem() {
		assertTrue(TenantId.of("self-host-tenant").isReserved());
		assertTrue(TenantId.of("system").isReserved());
	}

	@Test
	void isReservedIsFalseWhenTheValueIsATenantOfTheServicePortal() {
		assertFalse(TenantId.of("acme").isReserved());
		assertFalse(TenantId.of("self-host").isReserved());
	}

}
