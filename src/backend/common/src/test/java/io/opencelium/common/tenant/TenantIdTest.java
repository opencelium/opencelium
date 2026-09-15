package io.opencelium.common.tenant;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TenantIdTest {

    @Test
    void toStringReturnsTheIdBecauseATenantIdIsSafeToLog() {
        assertEquals("t-123", TenantId.of("t-123").toString());
    }

    @Test
    void constructorThrowsWhenValueIsBlank() {
        assertThrows(IllegalArgumentException.class, () -> TenantId.of(""));
    }

    @Test
    void constructorThrowsWhenValueIsNull() {
        assertThrows(NullPointerException.class, () -> TenantId.of(null));
    }
}
