package io.opencelium.common.tenant;

import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * A tenant ID has 1 to 64 characters: the letters a to z, the digits and the hyphen, with no hyphen first or last.
 * The reserved IDs have that form. A tenant ID from outside core has that form and is not a reserved ID.
 */
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

	@ParameterizedTest
	@MethodSource("permittedValues")
	void ofAcceptsTheValueWhenItHasThePermittedForm(String value) {
		assertEquals(value, TenantId.of(value).value());
	}

	@ParameterizedTest
	@MethodSource("valuesThatBreakTheForm")
	void ofStopsWhenTheValueBreaksARuleOfTheForm(String value) {
		assertThrows(IllegalArgumentException.class, () -> TenantId.of(value));
	}

	@Test
	void ofAcceptsTheReservedValues() {
		assertEquals(TenantId.SELF_HOST, TenantId.of("self-host-tenant"));
		assertEquals(TenantId.SYSTEM, TenantId.of("system"));
	}

	@ParameterizedTest
	@MethodSource("permittedValues")
	void fromOutsideGivesTheTenantWhenTheValueIsPermitted(String value) {
		assertEquals(TenantId.of(value), TenantId.fromOutside(value));
	}

	@ParameterizedTest
	@ValueSource(strings = {"self-host-tenant", "system"})
	void fromOutsideStopsWhenTheValueIsReserved(String value) {
		assertThrows(IllegalArgumentException.class, () -> TenantId.fromOutside(value));
	}

	@ParameterizedTest
	@MethodSource("valuesThatBreakTheForm")
	void fromOutsideStopsWhenTheValueBreaksARuleOfTheForm(String value) {
		assertThrows(IllegalArgumentException.class, () -> TenantId.fromOutside(value));
	}

	/** No rule forbids 2 hyphens in a row, a digit first, or a value that looks like the deployment mode. */
	static Stream<String> permittedValues() {
		return Stream.of("a", "7", "acme", "acme-gmbh", "a--b", "0-tenant", "self-host", "x".repeat(64));
	}

	static Stream<String> valuesThatBreakTheForm() {
		return Stream.of(
				// 1 to 64 characters
				"", "x".repeat(65),
				// only a to z, 0 to 9 and the hyphen
				"Acme", "ACME", "ac_me", "ac me", "ac.me", "ac/me", "äcme", "acme\n", " acme",
				// no hyphen first or last
				"-", "-acme", "acme-");
	}

}
