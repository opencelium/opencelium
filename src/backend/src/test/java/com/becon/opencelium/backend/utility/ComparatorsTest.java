package com.becon.opencelium.backend.utility;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ComparatorsTest {
    private final Comparator<String> COMPARATOR = Comparators.NUMERIC_PARTS;

    @Test
    void equality() {
        // indexPath
        assertEquals(0, COMPARATOR.compare("1", "1"));
        assertEquals(0, COMPARATOR.compare("1_2_3", "1_2_3"));

        // loopIndex
        assertEquals(0, COMPARATOR.compare("1", "1"));
        assertEquals(0, COMPARATOR.compare("1, 2, 3", "1, 2, 3"));
    }

    @Test
    void comparingNumericallyNotLexicographically() {
        // indexPath
        assertTrue(COMPARATOR.compare("1_2_10", "1_2_3") > 0);
        assertTrue(COMPARATOR.compare("1_2_3", "1_2_10") < 0);

        // loopIndex
        assertTrue(COMPARATOR.compare("1, 2, 10", "1, 2, 3") > 0);
        assertTrue(COMPARATOR.compare("1, 2, 3", "1, 2, 10") < 0);
    }

    @Test
    void multiDigitValuesForLevelIndex() {
        // indexPath
        assertTrue(COMPARATOR.compare("10_1", "2_9") > 0);
        assertTrue(COMPARATOR.compare("100", "99") > 0);

        // loopIndex
        assertTrue(COMPARATOR.compare("10, 1", "2, 9") > 0);
        assertTrue(COMPARATOR.compare("100", "99") > 0);
    }

    @Test
    void shorterPathIsSmallerWhenPrefixMatches() {
        // indexPath
        assertTrue(COMPARATOR.compare("1", "1_0") < 0);
        assertTrue(COMPARATOR.compare("2_3", "2_3_1") < 0);

        // loopIndex
        assertTrue(COMPARATOR.compare("1", "1, 0") < 0);
        assertTrue(COMPARATOR.compare("2, 3", "2, 3, 1") < 0);
    }

    @Test
    void comparesFirstSegmentCorrectly() {
        // indexPath
        assertTrue(COMPARATOR.compare("1_5", "2_0") < 0);
        assertTrue(COMPARATOR.compare("3", "2_9_9") > 0);

        // loopIndex
        assertTrue(COMPARATOR.compare("1, 5", "2, 0") < 0);
        assertTrue(COMPARATOR.compare("3", "2, 9, 9") > 0);
    }

    @Test
    void comparesMiddleSegmentCorrectly() {
        // indexPath
        assertTrue(COMPARATOR.compare("1_2_3", "1_3_0") < 0);
        assertTrue(COMPARATOR.compare("1_10_0", "1_2_9") > 0);

        // loopIndex
        assertTrue(COMPARATOR.compare("1, 2, 3", "1, 3, 0") < 0);
        assertTrue(COMPARATOR.compare("1, 10, 0", "1, 2, 9") > 0);
    }

    @Test
    void handlesZeroValues() {
        // indexPath
        assertTrue(COMPARATOR.compare("0", "1") < 0);
        assertTrue(COMPARATOR.compare("1_0", "1_1") < 0);

        // loopIndex
        assertTrue(COMPARATOR.compare("0", "1") < 0);
        assertTrue(COMPARATOR.compare("1, 0", "1, 1") < 0);
    }

    @Test
    void comparatorIsAntisymmetric() {
        // indexPath
        String a = "1_2";
        String b = "1_3";

        int ab = COMPARATOR.compare(a, b);
        int ba = COMPARATOR.compare(b, a);

        assertEquals(-ab, ba);

        // loopIndex
        String c = "1, 2";
        String d = "1, 3";

        int cd = COMPARATOR.compare(c, d);
        int dc = COMPARATOR.compare(d, c);

        assertEquals(-cd, dc);
    }

    @Test
    void comparatorIsTransitive() {
        // indexPath
        String a = "1";
        String b = "1_2";
        String c = "1_2_3";

        assertTrue(COMPARATOR.compare(a, b) < 0);
        assertTrue(COMPARATOR.compare(b, c) < 0);
        assertTrue(COMPARATOR.compare(a, c) < 0);

        // loopIndex
        // indexPath
        String e = "1";
        String f = "1, 2";
        String h = "1, 2, 3";

        assertTrue(COMPARATOR.compare(e, f) < 0);
        assertTrue(COMPARATOR.compare(f, h) < 0);
        assertTrue(COMPARATOR.compare(e, h) < 0);
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

        list.sort(COMPARATOR);

        assertEquals(
                List.of("0", "1", "1_2", "1_2_1", "1_10", "2"),
                list
        );
    }
}
