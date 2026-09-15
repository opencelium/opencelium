package io.opencelium.common.secret;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SecretRefTest {

    @Test
    void toStringReturnsTheIdBecauseAReferenceIsSafeToLog() {
        assertEquals("sec_9f2c", SecretRef.of("sec_9f2c").toString());
    }

    @Test
    void constructorThrowsWhenIdIsBlank() {
        assertThrows(IllegalArgumentException.class, () -> SecretRef.of(" "));
    }

    @Test
    void constructorThrowsWhenIdIsNull() {
        assertThrows(NullPointerException.class, () -> SecretRef.of(null));
    }
}
