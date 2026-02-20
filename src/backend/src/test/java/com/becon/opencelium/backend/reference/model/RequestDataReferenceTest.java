package com.becon.opencelium.backend.reference.model;

import com.becon.opencelium.backend.reference.enums.ReferenceType;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class RequestDataReferenceTest {
    /*
     * Test-only delegate for RequestDataReference.parse(..).
     * Used to reduce noise in "find usages" results from test code.
     */
    private static RequestDataReference parse(String rawReference) {
        return RequestDataReference.parse(rawReference);
    }


    // -------  POSITIVE cases  -------

    @Test
    void simpleKey() {
        RequestDataReference ref = parse("{username}");

        assertEquals("{username}", ref.getRaw());
        assertNull(ref.getCtorId());
        assertEquals("username", ref.getKey());
        assertEquals(ReferenceType.REQUEST_DATA, ref.getType());
    }

    @Test
    void keyWithCtorId() {
        RequestDataReference ref = parse("{#12.username}");

        assertEquals("{#12.username}", ref.getRaw());
        assertEquals(12, ref.getCtorId());
        assertEquals("username", ref.getKey());
    }

    @Test
    void largeCtorId() {
        RequestDataReference ref = parse("{#123456.key}");

        assertEquals(123456, ref.getCtorId());
        assertEquals("key", ref.getKey());
    }


    // -------  NEGATIVE cases  -------

    @Test
    void nullReferenceThrowsNullPointerException() {
        assertThrows(NullPointerException.class, () -> parse(null));
    }

    @Test
    void missingOpeningSyntaxThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> parse("username}"));
    }

    @Test
    void missingClosingBraceThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> parse("{username"));
    }

    @Test
    void emptyExpressionThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> parse("{}"));
    }

    @Test
    void onlyCtorIdMarkerThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> parse("{#}"));
    }

    @Test
    void missingKeyAfterDotThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> parse("{#12.}"));
    }

    @Test
    void nonNumericCtorIdThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> parse("{#abc.key}"));
    }

    @Test
    void missingDotWithCtorIdThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> parse("{#12}"));
    }

    @Test
    void invalidCtorIdSyntaxThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> parse("{#12key}"));
    }
}
