package com.becon.opencelium.backend.version_manager.base;

import java.util.Arrays;

public class Utils {
    public static int compare(String v1, String v2) {
        int[] parts1 = parseVersion(v1);
        int[] parts2 = parseVersion(v2);

        int length = Math.max(parts1.length, parts2.length);
        for (int i = 0; i < length; i++) {
            int num1 = (i < parts1.length) ? parts1[i] : 0; // Treat missing parts as 0
            int num2 = (i < parts2.length) ? parts2[i] : 0;
            if (num1 != num2) {
                return Integer.compare(num1, num2);
            }
        }
        return 0; // Versions are equal
    }

    private static int[] parseVersion(String version) {
        return Arrays.stream(version.split("\\."))
                .mapToInt(Integer::parseInt)
                .toArray();
    }
}
