package io.opencelium.common.secret;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SecretValueTest {

    private static final String CANARY = "canary-8f31c2a7";

    @Test
    void toStringHidesTheValue() {
        SecretValue value = SecretValue.of(CANARY);

        assertFalse(value.toString().contains(CANARY));
        assertEquals("SecretValue[***]", value.toString());
    }

    @Test
    void toStringHidesTheValueWhenNestedInAnotherObject() {
        record Credentials(String username, SecretValue password) { }

        String printed = new Credentials("admin", SecretValue.of(CANARY)).toString();

        assertFalse(printed.contains(CANARY), "a record's generated toString must not leak the secret");
        assertTrue(printed.contains("admin"));
    }

    @Test
    void asStringReturnsTheOriginalValue() {
        assertEquals(CANARY, SecretValue.of(CANARY).asString());
    }

    @Test
    void bytesReturnsACopySoCallersCannotMutateTheValue() {
        SecretValue value = SecretValue.of(CANARY);

        byte[] first = value.bytes();
        first[0] = 0;

        assertNotSame(first, value.bytes());
        assertArrayEquals(CANARY.getBytes(StandardCharsets.UTF_8), value.bytes());
    }

    @Test
    void ofByteArrayCopiesTheInputSoLaterChangesDoNotAffectTheValue() {
        byte[] input = CANARY.getBytes(StandardCharsets.UTF_8);

        SecretValue value = SecretValue.of(input);
        input[0] = 0;

        assertEquals(CANARY, value.asString());
    }

    @Test
    void equalsIsTrueForEqualValuesAndFalseOtherwise() {
        assertEquals(SecretValue.of(CANARY), SecretValue.of(CANARY));
        assertEquals(SecretValue.of(CANARY).hashCode(), SecretValue.of(CANARY).hashCode());
        assertFalse(SecretValue.of(CANARY).equals(SecretValue.of("other")));
    }

    @Test
    void ofThrowsWhenValueIsNull() {
        assertThrows(NullPointerException.class, () -> SecretValue.of((String) null));
        assertThrows(NullPointerException.class, () -> SecretValue.of((byte[]) null));
    }
}
