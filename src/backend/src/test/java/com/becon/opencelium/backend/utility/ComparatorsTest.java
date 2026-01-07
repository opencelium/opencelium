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
    void comparatorEqualityDoesNotMatchStringEquality() {
        // indexPath
        assertEquals(0, COMPARATOR.compare("01", "1"));
        assertEquals(0, COMPARATOR.compare("001_002", "1_2"));

        // loopIndex
        assertEquals(0, COMPARATOR.compare("01, 002", "1, 2"));
    }

    @Test
    void comparingNumericallyNotLexicographically() {
        // indexPath
        assertTrue(COMPARATOR.compare("1_2_10", "1_2_3") > 0);
        assertTrue(COMPARATOR.compare("1_2_10", "1_2_03") > 0);
        assertTrue(COMPARATOR.compare("1_2_3", "1_2_10") < 0);

        // loopIndex
        assertTrue(COMPARATOR.compare("1, 2, 10", "1, 2, 3") > 0);
        assertTrue(COMPARATOR.compare("1, 2, 3", "1, 2, 10") < 0);
        assertTrue(COMPARATOR.compare("1, 2, 03", "1, 2, 10") < 0);
    }

    @Test
    void ignoresTrailingSeparators() {
        // indexPath
        assertEquals(0, COMPARATOR.compare("1_2_", "1_2"));
        assertEquals(0, COMPARATOR.compare("01_002_", "1_2"));
        assertTrue(COMPARATOR.compare("1_2_", "1_3") < 0);

        // loopIndex
        assertEquals(0, COMPARATOR.compare("1, 2,", "1, 2"));
        assertEquals(0, COMPARATOR.compare("01, 002,", "1, 2"));
        assertTrue(COMPARATOR.compare("1, 2,", "1, 3") < 0);
    }

    @Test
    void ignoresLeadingSeparators() {
        // indexPath
        assertEquals(0, COMPARATOR.compare("_1_2", "1_2"));
        assertTrue(COMPARATOR.compare("_1_2", "1_3") < 0);
        assertTrue(COMPARATOR.compare("__3", "2_9") > 0);

        // loopIndex
        assertEquals(0, COMPARATOR.compare(",1,2", "1,2"));
        assertTrue(COMPARATOR.compare(",1,2", "1,3") < 0);
        assertTrue(COMPARATOR.compare(",,3", "2,9") > 0);
    }

    @Test
    void multiDigitValuesForLevelIndex() {
        // indexPath
        assertTrue(COMPARATOR.compare("10_1", "2_9") > 0);
        assertTrue(COMPARATOR.compare("10_1", "2_09") > 0);
        assertTrue(COMPARATOR.compare("100", "99") > 0);

        // loopIndex
        assertTrue(COMPARATOR.compare("10, 1", "2, 9") > 0);
        assertTrue(COMPARATOR.compare("100", "99") > 0);
        assertTrue(COMPARATOR.compare("100", "099") > 0);
        assertTrue(COMPARATOR.compare("100", "990") < 0);
    }

    @Test
    void shorterPathIsSmallerWhenPrefixMatches() {
        // indexPath
        assertTrue(COMPARATOR.compare("1", "1_0") < 0);
        assertTrue(COMPARATOR.compare("01", "1_0") < 0);
        assertTrue(COMPARATOR.compare("2_3", "2_3_1") < 0);
        assertTrue(COMPARATOR.compare("02_003", "2_3_1") < 0);

        // loopIndex
        assertTrue(COMPARATOR.compare("1", "1, 0") < 0);
        assertTrue(COMPARATOR.compare("2, 3", "2, 3, 1") < 0);
    }

    @Test
    void comparesFirstSegmentCorrectly() {
        // indexPath
        assertTrue(COMPARATOR.compare("1_5", "2_0") < 0);
        assertTrue(COMPARATOR.compare("01_5", "002_0") < 0);
        assertTrue(COMPARATOR.compare("3", "2_9_9") > 0);
        assertTrue(COMPARATOR.compare("003", "02_9_9") > 0);

        // loopIndex
        assertTrue(COMPARATOR.compare("1, 5", "2, 0") < 0);
        assertTrue(COMPARATOR.compare("001, 5", "02, 0") < 0);
        assertTrue(COMPARATOR.compare("3", "2, 9, 9") > 0);
        assertTrue(COMPARATOR.compare("03", "002, 9, 9") > 0);
    }

    @Test
    void comparesMiddleSegmentCorrectly() {
        // indexPath
        assertTrue(COMPARATOR.compare("1_2_3", "1_3_0") < 0);
        assertTrue(COMPARATOR.compare("1_02_3", "1_003_0") < 0);
        assertTrue(COMPARATOR.compare("1_10_0", "1_2_9") > 0);
        assertTrue(COMPARATOR.compare("1_0010_0", "1_02_9") > 0);

        // loopIndex
        assertTrue(COMPARATOR.compare("1, 2, 3", "1, 3, 0") < 0);
        assertTrue(COMPARATOR.compare("1, 002, 3", "1, 03, 0") < 0);
        assertTrue(COMPARATOR.compare("1, 10, 0", "1, 2, 9") > 0);
        assertTrue(COMPARATOR.compare("1, 010, 0", "1, 002, 9") > 0);
    }

    @Test
    void handlesZeroValues() {
        // indexPath
        assertTrue(COMPARATOR.compare("0", "1") < 0);
        assertTrue(COMPARATOR.compare("00", "01") < 0);
        assertTrue(COMPARATOR.compare("1_0", "1_1") < 0);

        // loopIndex
        assertTrue(COMPARATOR.compare("0", "1") < 0);
        assertTrue(COMPARATOR.compare("00", "001") < 0);
        assertTrue(COMPARATOR.compare("1, 0", "1, 1") < 0);
    }

    @Test
    void handlesVeryLargeNumericValues() {
        // indexPath
        assertTrue(
                COMPARATOR.compare("99999999999999999999", "100000000000000000000") < 0
        );
        assertTrue(
                COMPARATOR.compare("100000000000000000000_1", "99999999999999999999_9") > 0
        );

        // loopIndex
        assertTrue(
                COMPARATOR.compare("99999999999999999999", "100000000000000000000") < 0
        );
        assertTrue(
                COMPARATOR.compare("100000000000000000000, 1", "99999999999999999999, 9") > 0
        );
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
        list.add("0_1_1");
        list.add("0_3_3_1");
        list.add("0_3_9_0");
        list.add("0");
        list.add("0_3_2");
        list.add("0_3_0");
        list.add("0_3_6");
        list.add("0_3_10");
        list.add("0_1");
        list.add("0_3_4_0");
        list.add("0_3_8");
        list.add("0_3_9_2");
        list.add("0_3_11_0");
        list.add("0_3_5");
        list.add("0_2");
        list.add("0_3_3_0");
        list.add("0_3_11");
        list.add("0_0");
        list.add("0_3_1");
        list.add("0_3_9");
        list.add("0_1_0");
        list.add("0_3_9_1");
        list.add("0_3_3");
        list.add("0_3_7");
        list.add("0_3");
        list.add("0_3_4");

        list.sort(COMPARATOR);

        assertEquals(
                List.of("0", "0_0", "0_1", "0_1_0", "0_1_1", "0_2",
                        "0_3", "0_3_0", "0_3_1", "0_3_2", "0_3_3", "0_3_3_0",
                        "0_3_3_1", "0_3_4", "0_3_4_0", "0_3_5", "0_3_6",
                        "0_3_7", "0_3_8", "0_3_9", "0_3_9_0", "0_3_9_1",
                        "0_3_9_2", "0_3_10", "0_3_11", "0_3_11_0"),
                list
        );
    }
}
