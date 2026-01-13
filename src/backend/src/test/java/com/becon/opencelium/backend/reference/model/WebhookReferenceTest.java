package com.becon.opencelium.backend.reference.model;

import com.becon.opencelium.backend.enums.execution.DataType;
import com.becon.opencelium.backend.reference.enums.ReferenceType;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class WebhookReferenceTest {
    /*
     * Test-only delegate for WebhookReference.parse(..).
     * Used to reduce noise in "find usages" results from test code.
     */
    private static WebhookReference parse(String rawReference) {
        return WebhookReference.parse(rawReference);
    }


    // -------  POSITIVE cases  -------

    @Test
    void simplePathWithoutDataType() {
        WebhookReference ref = parse("${key}");

        assertEquals("key", ref.getPath());
        assertEquals(DataType.UNDEFINED, ref.getDataType());
        assertEquals("${key}", ref.getRaw());
        assertEquals(ReferenceType.WEBHOOK, ref.getType());
    }

    @Test
    void complexPathWithoutDataType() {
        WebhookReference ref = parse("${key.field[*]}");

        assertEquals("key.field[*]", ref.getPath());
        assertEquals(DataType.UNDEFINED, ref.getDataType());
    }

    @Test
    void complexPathWithDataType() {
        WebhookReference ref = parse("${key.field[0].id:integer}");

        assertEquals("key.field[0].id", ref.getPath());
        assertEquals(DataType.INTEGER, ref.getDataType());
    }


    // -------  NEGATIVE cases  -------
    @Test
    void nullReferenceThrowsNullPointerException() {
        assertThrows(NullPointerException.class, () -> parse(null));
    }

    @Test
    void missingOpeningSyntaxThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> parse("key}"));
    }

    @Test
    void missingClosingBraceThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> parse("${key"));
    }

    @Test
    void emptyExpressionThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> parse("${}"));
    }

    @Test
    void unknownDataTypeThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> parse("${key:unknown}"));
    }
}
