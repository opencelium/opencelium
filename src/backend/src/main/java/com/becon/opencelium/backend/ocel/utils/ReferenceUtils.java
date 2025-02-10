package com.becon.opencelium.backend.ocel.utils;

import com.becon.opencelium.backend.constant.RegExpression;

import java.util.HashMap;
import java.util.Map;

public class ReferenceUtils {
    private static final Map<String, String> prefixSuffixMap;

    static {
        prefixSuffixMap = new HashMap<>();
        prefixSuffixMap.put("{%#", "%}");
        prefixSuffixMap.put("#{%", "%}");
        prefixSuffixMap.put("${", "}");
        prefixSuffixMap.put("{", "}");
    }

    private ReferenceUtils() {}

    public static Map<String, String> getPreSufMap() {
        return prefixSuffixMap;
    }

    public static boolean isReference(String token) {
        return token.matches(RegExpression.wrappedDirectRef)
                || token.matches(RegExpression.enhancement)
                || token.matches(RegExpression.requestData)
                || token.matches(RegExpression.webhook);
    }
}
