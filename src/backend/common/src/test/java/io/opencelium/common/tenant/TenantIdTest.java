package io.opencelium.common.tenant;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TenantIdTest {

	@Test
	void wellKnownTenantsAreDistinct() {
		assertNotEquals(TenantId.SELF, TenantId.SYSTEM);
		assertEquals("self", TenantId.SELF.value());
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

}
