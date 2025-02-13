package com.becon.opencelium.backend.version_manager.base;

import org.apache.commons.lang3.StringUtils;

import java.util.Arrays;
import java.util.Objects;

public class Utils {
    public static int compare(String v1, String v2) {
        if (Objects.isNull(v1)) {
            return Objects.isNull(v2) ? 0 : 1;
        }
        if (Objects.isNull(v2)) {
            return -1;
        }
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

    public static String lowerFirstChar(String value) {
        return !StringUtils.isBlank(value)
                ? value.substring(0, 1).toLowerCase() + value.substring(1)
                : value;
    }


    private static int[] parseVersion(String version) {
        return Arrays.stream(version.split("\\."))
                .mapToInt(Integer::parseInt)
                .toArray();
    }
}
