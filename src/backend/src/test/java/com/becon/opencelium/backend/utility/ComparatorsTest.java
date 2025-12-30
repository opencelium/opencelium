package com.becon.opencelium.backend.utility;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ComparatorsTest {

    @Test
    void equality() {
        assertEquals(0, Comparators.compareIndexPath("1", "1"));
        assertEquals(0, Comparators.compareIndexPath("1_2_3", "1_2_3"));
    }

    @Test
    void comparingNumerically_notLexicographically() {
        assertTrue(Comparators.compareIndexPath("1_2_10", "1_2_3") > 0);
        assertTrue(Comparators.compareIndexPath("1_2_3", "1_2_10") < 0);
    }

    @Test
    void multiDigitValuesForLevelIndex() {
        assertTrue(Comparators.compareIndexPath("10_1", "2_9") > 0);
        assertTrue(Comparators.compareIndexPath("100", "99") > 0);
    }

    @Test
    void shorterPathIsSmallerWhenPrefixMatches() {
        assertTrue(Comparators.compareIndexPath("1", "1_0") < 0);
        assertTrue(Comparators.compareIndexPath("2_3", "2_3_1") < 0);
    }

    @Test
    void comparesFirstSegmentCorrectly() {
        assertTrue(Comparators.compareIndexPath("1_5", "2_0") < 0);
        assertTrue(Comparators.compareIndexPath("3", "2_9_9") > 0);
    }

    @Test
    void comparesMiddleSegmentCorrectly() {
        assertTrue(Comparators.compareIndexPath("1_2_3", "1_3_0") < 0);
        assertTrue(Comparators.compareIndexPath("1_10_0", "1_2_9") > 0);
    }

    @Test
    void handlesZeroValues() {
        assertTrue(Comparators.compareIndexPath("0", "1") < 0);
        assertTrue(Comparators.compareIndexPath("1_0", "1_1") < 0);
    }

    @Test
    void comparatorIsAntisymmetric() {
        String a = "1_2";
        String b = "1_3";

        int ab = Comparators.compareIndexPath(a, b);
        int ba = Comparators.compareIndexPath(b, a);

        assertEquals(-ab, ba);
    }

    @Test
    void comparatorIsTransitive() {
        String a = "1";
        String b = "1_2";
        String c = "1_2_3";

        assertTrue(Comparators.compareIndexPath(a, b) < 0);
        assertTrue(Comparators.compareIndexPath(b, c) < 0);
        assertTrue(Comparators.compareIndexPath(a, c) < 0);
    }

    @Test
    void sortsIndexPathsCorrectly() {
        List<String> list = new ArrayList<>();
        list.add("1_2");
        list.add("1");
        list.add("1_10");
        list.add("1_2_1");
        list.add("0");
        list.add("2");

        list.sort(Comparators.INDEX_PATH);

        assertEquals(
                List.of("0", "1", "1_2", "1_2_1", "1_10", "2"),
                list
        );
    }
}
