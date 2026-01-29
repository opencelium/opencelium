package com.becon.opencelium.backend.reference.model;

import com.becon.opencelium.backend.reference.enums.ReferenceType;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class EnhancementReferenceTest {
    /*
     * Test-only delegate for EnhancementReference.parse(..).
     * Used to reduce noise in "find usages" results from test code.
     */
    private static EnhancementReference parse(String rawReference) {
        return EnhancementReference.parse(rawReference);
    }


    // -------  POSITIVE cases  -------

    @Test
    void lowercaseHexBindId() {
        String raw = "#{%abcdef0123456789abcdef01%}";

        EnhancementReference ref = parse(raw);

        assertEquals(raw, ref.getRaw());
        assertEquals("abcdef0123456789abcdef01", ref.getBindId());
        assertEquals(ReferenceType.ENHANCEMENT, ref.getType());
    }

    @Test
    void uppercaseHexBindId() {
        String raw = "#{%ABCDEF0123456789ABCDEF01%}";

        EnhancementReference ref = parse(raw);

        assertEquals("ABCDEF0123456789ABCDEF01", ref.getBindId());
    }

    @Test
    void mixedCaseHexBindId() {
        String raw = "#{%AbCdEf0123456789aBcDeF01%}";

        EnhancementReference ref = parse(raw);

        assertEquals("AbCdEf0123456789aBcDeF01", ref.getBindId());
    }


    // -------  NEGATIVE cases  -------

    @Test
    void nullReferenceThrowsException() {
        assertThrows(NullPointerException.class, () -> parse(null));
    }

    @Test
    void missingHashThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> parse("{%abcdef0123456789abcdef01%}"));
    }

    @Test
    void missingOpeningBraceThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> parse("#%abcdef0123456789abcdef01%}"));
    }

    @Test
    void missingPercentThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> parse("#{abcdef0123456789abcdef01}"));
    }

    @Test
    void missingClosingBraceThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> parse("#{%abcdef0123456789abcdef01%"));
    }

    @Test
    void bindIdTooShortThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> parse("#{%abc%}"));
    }

    @Test
    void bindIdTooLongThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> parse("#{%abcdef0123456789abcdef0123%}"));
    }

    @Test
    void bindIdContainsNonHexCharactersThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> parse("#{%abcdef0123456789abcdeg01%}"));
    }

    @Test
    void extraCharactersPresentThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> parse("#{%abcdef0123456789abcdef01%}x"));
    }
}
