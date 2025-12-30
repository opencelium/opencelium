package com.becon.opencelium.backend.utility;

import java.util.Comparator;

public final class Comparators {

    private Comparators() {
    }

    /**
     * Compares hierarchical numeric index paths: i_j_k_... (i, j, k are non-negative integers)
     * Example: 1_2_10 > 1_2_3
     */
    public static final Comparator<String> INDEX_PATH = Comparators::compareIndexPath;

    public static int compareIndexPath(String idx1, String idx2) {
        int len1 = idx1.length();
        int len2 = idx2.length();
        int pointer1 = 0, pointer2 = 0;

        // move pointers to convert each levels index to a number
        while (pointer1 < len1 && pointer2 < len2) {
            int v1 = 0;
            int v2 = 0;

            while (pointer1 < len1 && idx1.charAt(pointer1) != '_') {
                v1 = v1 * 10 + (idx1.charAt(pointer1++) - '0');
            }

            while (pointer2 < len2 && idx2.charAt(pointer2) != '_') {
                v2 = v2 * 10 + (idx2.charAt(pointer2++) - '0');
            }

            if (v1 != v2) {
                return Integer.compare(v1, v2);
            }

            // skip level separator character '_'
            pointer1++;
            pointer2++;
        }

        // if both are the same chart then longer one should be larger
        return Integer.compare(len1, len2);
    }
}

