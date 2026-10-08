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
}
