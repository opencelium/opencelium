package com.becon.opencelium.backend.reference.model;

import com.becon.opencelium.backend.enums.execution.DataType;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class WebhookReferenceTest {

    // -------  POSITIVE cases  -------

    @Test
    void simplePathWithoutDataType() {
        WebhookReference ref = WebhookReference.parse("${key}");

        assertEquals("key", ref.getPath());
        assertEquals(DataType.UNDEFINED, ref.getDataType());
        assertEquals("${key}", ref.getRaw());
        assertEquals(ReferenceType.WEBHOOK, ref.getType());
    }

    @Test
    void complexPathWithoutDataType() {
        WebhookReference ref = WebhookReference.parse("${key.field[*]}");

        assertEquals("key.field[*]", ref.getPath());
        assertEquals(DataType.UNDEFINED, ref.getDataType());
    }

    @Test
    void complexPathWithDataType() {
        WebhookReference ref =
                WebhookReference.parse("${key.field[0].id:integer}");

        assertEquals("key.field[0].id", ref.getPath());
        assertEquals(DataType.INTEGER, ref.getDataType());
    }


    // -------  NEGATIVE cases  -------
    @Test
    void nullReferenceThrowsNullPointerException() {
        assertThrows(
                NullPointerException.class,
                () -> WebhookReference.parse(null)
        );
    }

    @Test
    void missingOpeningSyntaxThrowsException() {
        assertThrows(
                IllegalArgumentException.class,
                () -> WebhookReference.parse("key}")
        );
    }

    @Test
    void missingClosingBraceThrowsException() {
        assertThrows(
                IllegalArgumentException.class,
                () -> WebhookReference.parse("${key")
        );
    }

    @Test
    void emptyExpressionThrowsException() {
        assertThrows(
                IllegalArgumentException.class,
                () -> WebhookReference.parse("${}")
        );
    }

    @Test
    void unknownDataTypeThrowsException() {
        assertThrows(
                IllegalArgumentException.class,
                () -> WebhookReference.parse("${key:unknown}")
        );
    }
}
