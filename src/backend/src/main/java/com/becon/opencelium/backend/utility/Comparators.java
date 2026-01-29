package com.becon.opencelium.backend.utility;

import java.util.Comparator;

public final class Comparators {

    private Comparators() {
    }

    public static final Comparator<String> NUMERIC_PARTS = Comparators::compareNumericParts;


    /**
     * Compares two strings as hierarchical numeric paths.
     *
     * <p>Each input string is interpreted as an ordered sequence of
     * <em>non-negative decimal integers</em> separated by one or more
     * non-digit characters. Separator characters themselves have no
     * semantic meaning and are ignored during comparison.
     *
     * <h3>Examples</h3>
     * <pre>{@code
     * "1_2_10"   > "1_2_3"
     * "1, 2, 10" > "1, 2, 3"
     * "1->2->3"  > "1->2->1"
     * "1_2"      < "1_2_0"
     * "1_02"     = "1_2"
     * }</pre>
     *
     * <p><strong>Input constraints:</strong>
     * <ul>
     *   <li>Numeric components consist only of ASCII digits {@code '0'..'9'}.</li>
     *   <li>All numeric values are non-negative.</li>
     *   <li>At least one numeric component is expected in each string.</li>
     * </ul>
     */
    private static int compareNumericParts(String str1, String str2) {
        int start1 = 0, start2 = 0;
        int length1 = str1.length(), length2 = str2.length();

        while (true) {
            // skip separators, move pointers to start of level number
            while (start1 < length1 && !isAsciiDigit(str1.charAt(start1))) start1++;
            while (start2 < length2 && !isAsciiDigit(str2.charAt(start2))) start2++;


            // if one string ended then longer one should be higher
            if (start1 == length1 || start2 == length2) {
                return (start1 < length1) ? 1 : (start2 < length2 ? -1 : 0);
            }


            // skip leading zeros
            while (start1 < length1 && str1.charAt(start1) == '0') start1++;
            while (start2 < length2 && str2.charAt(start2) == '0') start2++;


            // find end of level number
            int end1 = start1;
            while (end1 < length1 && isAsciiDigit(str1.charAt(end1))) end1++;

            int end2 = start2;
            while (end2 < length2 && isAsciiDigit(str2.charAt(end2))) end2++;


            // level number containing more positive number wins
            int count1 = end1 - start1;
            int count2 = end2 - start2;

            if (count1 != count2) {
                return Integer.compare(count1, count2);
            }


            // for same number of positive numbers do lexicographic digit comparison
            for (int i = 0; i < count1; i++) {
                char ch1 = str1.charAt(start1 + i);
                char ch2 = str2.charAt(start2 + i);
                if (ch1 != ch2) {
                    return ch1 - ch2;
                }
            }

            // level numbers are equal, continue
            start1 = end1;
            start2 = end2;
        }
    }

    /**
     * Returns true iff the character represents an ASCII decimal digit [0–9].
     * NOTE. This method does NOT recognize Unicode digits.
     */
    private static boolean isAsciiDigit(char c) {
        return c >= '0' && c <= '9';
    }
}

