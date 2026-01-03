package com.becon.opencelium.backend.reference.model;

import com.becon.opencelium.backend.enums.PageParam;
import com.becon.opencelium.backend.reference.enums.ReferenceType;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PageReferenceTest {

    // -------  POSITIVE cases  -------

    @Test
    void limitParam() {
        PageReference ref = PageReference.parse("@{limit}");

        assertEquals("@{limit}", ref.getRaw());
        assertEquals(PageParam.LIMIT, ref.getPageParam());
        assertEquals(ReferenceType.PAGE, ref.getType());
    }

    @Test
    void sizeParam() {
        PageReference ref = PageReference.parse("@{size}");

        assertEquals(PageParam.SIZE, ref.getPageParam());
    }

    @Test
    void paramIsCaseInsensitive() {
        PageReference ref = PageReference.parse("@{LiMiT}");

        assertEquals(PageParam.LIMIT, ref.getPageParam());
    }


    // -------  NEGATIVE cases  -------

    @Test
    void nullReferenceThrowsException() {
        assertThrows(
                NullPointerException.class,
                () -> PageReference.parse(null)
        );
    }

    @Test
    void missingOpeningSyntaxThrowsException() {
        assertThrows(
                IllegalArgumentException.class,
                () -> PageReference.parse("limit}")
        );
    }

    @Test
    void missingClosingBraceThrowsException() {
        assertThrows(
                IllegalArgumentException.class,
                () -> PageReference.parse("@{limit")
        );
    }

    @Test
    void emptyExpressionThrowsException() {
        assertThrows(
                IllegalArgumentException.class,
                () -> PageReference.parse("@{}")
        );
    }

    @Test
    void unknownParamThrowsException() {
        assertThrows(
                IllegalArgumentException.class,
                () -> PageReference.parse("@{unknown}")
        );
    }
}
