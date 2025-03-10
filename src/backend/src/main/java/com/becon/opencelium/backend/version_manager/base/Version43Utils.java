package com.becon.opencelium.backend.version_manager.base;

import org.apache.commons.lang3.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class Version43Utils {

    private static final Pattern REFERENCE_REGEX = Pattern.compile("#[a-zA-Z0-9]{6}\\.(\\(response\\)|\\(request\\))\\.[^;]*");
    private static final Pattern REQUEST_PATTERN = Pattern.compile("^(#\\w+)\\.(\\(request\\))\\.(.+)$");
    private static final Pattern RESPONSE_PATTERN = Pattern.compile("^(#\\w+)\\.(\\(response\\))\\.(success|fail)\\.(.+)$");

    public static String updateRef(String rawStr) {
        Matcher referenceMatcher = REFERENCE_REGEX.matcher(rawStr);
        StringBuilder result = new StringBuilder();

        while (referenceMatcher.find()) {
            String match = referenceMatcher.group();
            Matcher requestMatcher = REQUEST_PATTERN.matcher(match);
            Matcher responseMatcher = RESPONSE_PATTERN.matcher(match);
            String replacement = match; // Default to original

            if (requestMatcher.matches()) {
                replacement = requestMatcher.group(1) + "." + requestMatcher.group(2) + ".body.$." + requestMatcher.group(3);
            } else if (responseMatcher.matches()) {
                replacement = responseMatcher.group(1) + "." + responseMatcher.group(2) + ".body.$." + responseMatcher.group(4);
            }

            referenceMatcher.appendReplacement(result, Matcher.quoteReplacement(replacement));
        }

        referenceMatcher.appendTail(result);
        return result.toString();
    }

    public static String updateField(String rawStr, boolean isHeader) {
        if (!rawStr.startsWith("body.$.") && !rawStr.startsWith("header.$.") && !rawStr.equals("status")) {
            if (rawStr.startsWith("success"))
                rawStr = rawStr.replaceFirst("success.", "");
            else if (rawStr.startsWith("fail"))
                rawStr = rawStr.replaceFirst("fail.", "");
            return isHeader ? "header.$." + rawStr : "body.$." + rawStr;
        }
        return rawStr;
    }

    public static Map<String, Object> updateMap(Map<String, Object> obj, Reference<Boolean> changed) {
        for (Map.Entry<String, Object> entry : obj.entrySet()) {
            if (entry.getValue() instanceof String str) {
                entry.setValue(replace(str, changed));
            } else if (entry.getValue() instanceof Map<?, ?>) {
                @SuppressWarnings("unchecked") Map<String, Object> object = (Map<String, Object>) entry.getValue();
                entry.setValue(updateMap(object, changed));
            } else if (entry.getValue() instanceof List<?> list) {
                entry.setValue(updateList(list, changed));
            }
        }
        return obj;
    }

    public static List<?> updateList(List<?> list, Reference<Boolean> changed) {
        List<Object> responseList = new ArrayList<>();
        for (int i = 0; i < list.size(); i++) {
            Object obj = list.get(i);
            if (obj instanceof String str) {
                responseList.add(i, replace(str, changed));
            } else if (obj instanceof Map<?, ?>) {
                @SuppressWarnings("unchecked") Map<String, Object> object = (Map<String, Object>) obj;
                responseList.add(updateMap(object, changed));
            } else if (obj instanceof List<?> innerList) {
                responseList.add(updateList(innerList, changed));
            } else {
                responseList.add(obj);
            }
        }
        return responseList;
    }

    public static String replace(String rawStr, Reference<Boolean> changed) {
        return replace(rawStr, changed, false, false);
    }

    public static String replace(String rawStr) {
        return replace(rawStr, false, false);
    }

    public static String replace(String rawStr, Reference<Boolean> changed, boolean onlyField, boolean isHeader) {
        String replaced = replace(rawStr, onlyField, isHeader);
        if (!StringUtils.equals(replaced, rawStr)) {
            changed.setValue(true);
        }
        return replaced;
    }

    public static String replace(String rawStr, boolean onlyField, boolean isHeader) {
        if (Objects.isNull(rawStr))
            return null;

        return onlyField
                ? updateField(rawStr, isHeader)
                : Version43Utils.updateRef(rawStr);
    }
}
