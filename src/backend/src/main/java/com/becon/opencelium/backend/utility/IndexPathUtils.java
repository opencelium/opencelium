package com.becon.opencelium.backend.utility;

import java.util.Arrays;

public class IndexPathUtils {

    private static final String INDEX_PATH_SEPARATOR = "_";

    public static int compare(String idx1, String idx2) {

        int[] parts1 = parseIndexPath(idx1);
        int[] parts2 = parseIndexPath(idx2);

        int length = Math.max(parts1.length, parts2.length);
        for (int i = 0; i < length; i++) {
            int num1 = (i < parts1.length) ? parts1[i] : -1;
            int num2 = (i < parts2.length) ? parts2[i] : -1;
            if (num1 != num2) {
                return Integer.compare(num1, num2);
            }
        }
        return 0;
    }

    private static int[] parseIndexPath(String path) {
        try {
            return Arrays.stream(path.split(INDEX_PATH_SEPARATOR))
                    .mapToInt(Integer::parseInt)
                    .toArray();
        } catch (Exception e) {
            return new int[]{-1};
        }
    }
}
