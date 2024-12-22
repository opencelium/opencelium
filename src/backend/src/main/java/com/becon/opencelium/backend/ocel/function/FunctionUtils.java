package com.becon.opencelium.backend.ocel.function;

public class FunctionUtils {
    public static boolean isFunction(String token) {
        return FunctionEnum.fromNameNullable(token) != null;
    }

    public static FunctionEnum findStartingFunction(char[] chars, int i) {
        for (int j = i; j < chars.length; j++) {
            if (chars[j] != '(' && !Character.isJavaIdentifierPart(chars[j])) {
                return null;
            }
            if (chars[j] == '(') {
                String name = new String(chars, i, j - i);
                return FunctionEnum.fromNameNullable(name);
            }
        }
        return null;
    }
}
