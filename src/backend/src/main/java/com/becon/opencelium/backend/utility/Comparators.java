package com.becon.opencelium.backend.utility;

import java.util.Comparator;

public final class Comparators {

    private Comparators() {
    }

    public static final Comparator<String> NUMERIC_PARTS = Comparators::compareNumericParts;


    /**
     * Compares two strings by interpreting them as hierarchical sequences of
     * non-negative integers. Integer components are parsed in order and compared
     * lexicographically. Any non-digit characters are treated as separators.
     *
     * <p>Examples:
     * <pre>
     * 1_2_10   > 1_2_3
     * 1, 2, 10 > 1, 2, 3
     * 1->2->3  > 1->2->1
     * </pre>
     */
    private static int compareNumericParts(String s1, String s2) {
        int len1 = s1.length(), len2 = s2.length();
        int pointer1 = 0, pointer2 = 0;

        while (pointer1 < len1 && pointer2 < len2) {
            // skip level separator characters (non-digits):
            // '_' (underscore for indexPath),
            // ", " (comma and space for loopIndex)
            while (pointer1 < len1 && !Character.isDigit(s1.charAt(pointer1))) pointer1++;
            while (pointer2 < len2 && !Character.isDigit(s2.charAt(pointer2))) pointer2++;

            if (pointer1 >= len1 || pointer2 >= len2) break;

            int v1 = 0, v2 = 0;

            while (pointer1 < len1 && Character.isDigit(s1.charAt(pointer1))) {
                v1 = v1 * 10 + (s1.charAt(pointer1++) - '0');
            }

            while (pointer2 < len2 && Character.isDigit(s2.charAt(pointer2))) {
                v2 = v2 * 10 + (s2.charAt(pointer2++) - '0');
            }

            if (v1 != v2) {
                return Integer.compare(v1, v2);
            }
        }

        return Integer.compare(len1, len2);
    }
}

