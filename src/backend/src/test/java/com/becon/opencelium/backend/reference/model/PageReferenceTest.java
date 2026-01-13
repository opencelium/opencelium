package com.becon.opencelium.backend.reference.model;

import com.becon.opencelium.backend.enums.PageParam;
import com.becon.opencelium.backend.reference.enums.ReferenceType;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PageReferenceTest {
    /*
     * Test-only delegate for PageReference.parse(..).
     * Used to reduce noise in "find usages" results from test code.
     */
    private static PageReference parse(String rawReference) {
        return PageReference.parse(rawReference);
    }


    // -------  POSITIVE cases  -------

    @Test
    void limitParam() {
        PageReference ref = parse("@{limit}");

        assertEquals("@{limit}", ref.getRaw());
        assertEquals(PageParam.LIMIT, ref.getPageParam());
        assertEquals(ReferenceType.PAGE, ref.getType());
    }

    @Test
    void sizeParam() {
        PageReference ref = parse("@{size}");

        assertEquals(PageParam.SIZE, ref.getPageParam());
    }

    @Test
    void paramIsCaseInsensitive() {
        PageReference ref = parse("@{LiMiT}");

        assertEquals(PageParam.LIMIT, ref.getPageParam());
    }


    // -------  NEGATIVE cases  -------

    @Test
    void nullReferenceThrowsException() {
        assertThrows(NullPointerException.class, () -> parse(null));
    }

    @Test
    void missingOpeningSyntaxThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> parse("limit}"));
    }

    @Test
    void missingClosingBraceThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> parse("@{limit"));
    }

    @Test
    void emptyExpressionThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> parse("@{}"));
    }

    @Test
    void unknownParamThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> parse("@{unknown}"));
    }
}
