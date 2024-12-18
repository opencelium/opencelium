package com.becon.opencelium.backend.ocel.common;

public class Utils {

    private Utils() {}

    public static boolean startsWith(String prefix, char[] chars, int i) {
        int length = prefix.length();
        if (chars.length < i + length) {
            return false;
        }
        for (int j = 0; j < length; j++) {
            if (chars[i + j] != prefix.charAt(j)) {
                return false;
            }
        }
        return true;
    }
}
