package com.becon.opencelium.backend.reference.utility;

import com.becon.opencelium.backend.reference.ReferenceDetector;
import com.becon.opencelium.backend.reference.ReferenceParser;
import com.becon.opencelium.backend.reference.ReferenceScanner;
import com.becon.opencelium.backend.reference.model.Reference;

import java.util.ArrayList;
import java.util.List;
import java.util.Stack;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ReferenceUtility {
    public static final Pattern FOR_IN_KEY_PATTERN = Pattern.compile("\\['([^\\[\\]']*)'\\]~");
    public static final Pattern FOR_IN_VALUE_PATTERN = Pattern.compile("\\['([^\\[\\]']*)'\\]");
    public static final Pattern SPLIT_STRING_PATTERN = Pattern.compile("\\[([a-z0-9*]+)\\]~");
    public static final Pattern ARRAY_LETTER_INDEX_PATTERN = Pattern.compile("\\[([a-z])\\]");

    public static String getContainedReferenceAndType(String expression) {
        if (ReferenceDetector.containsReference(expression)) {
            List<String> references = ReferenceScanner.extract(expression);

            String res = references.get(0);
            Reference reference = ReferenceParser.parse(res);

            return reference.getType() + " ref(" + res + ")";
        }

        return "NO ref(" + expression + ")";
    }

    public static String extractReference(String value, String type) {
        Pattern pattern = Pattern.compile(type);
        Matcher matcher = pattern.matcher(value);

        if (matcher.find()) {
            return matcher.group();
        }

        return null;
    }

    public static String extractExchangeType(String ref) {
        // '#ababab.(response)...'
        // '#ababab.(request)...'
        return ref.charAt(11) == 's' ? "response" : "request";
    }

    @Deprecated
    public static String getResult(String ref) {
        String exchange = extractExchangeType(ref);
        String res = "";

        if (exchange.equals("response")) {
            res = ref.split("\\.")[2];
        }

        return res;
    }

    public static String[] splitPaths(String paths) {
        if (paths.isBlank()) {
            return new String[]{""};
        }

        paths += ".";

        List<String> parts = new ArrayList<>();
        StringBuilder holder = new StringBuilder();
        Stack<Character> braces = new Stack<>();

        for (char current : paths.toCharArray()) {
            if (current == '.' && braces.isEmpty()) {
                parts.add(holder.toString());

                holder = new StringBuilder();
            } else if (current == '[') {
                braces.push(current);
                holder.append(current);
            } else if (current == ']') {
                if (braces.isEmpty() || braces.pop() != '[') {
                    throw new RuntimeException("Wrong value is supplied to reference");
                }

                holder.append(current);
            } else {
                holder.append(current);
            }
        }

        String[] result = new String[parts.size()];

        for (int i = 0; i < parts.size(); i++) {
            result[i] = wrapSpacesIfNecessary(parts.get(i));
        }

        return result;
    }

    private static String wrapSpacesIfNecessary(String part) {
        if (!part.contains(" ")) {
            return part;
        }

        StringBuilder result = new StringBuilder();
        StringBuilder holder = new StringBuilder();
        Stack<Character> braces = new Stack<>();
        char current;

        for (int i = 0; i < part.length(); i++) {
            current = part.charAt(i);

            if (current == '[') {
                appendNonEmptyHolder(result, holder);
                braces.push(current);
                result.append(current);
            } else if (current == ']') {
                if (braces.isEmpty() || braces.pop() != '[') {
                    throw new RuntimeException("Wrong value is supplied to reference");
                }

                result.append(current);
            } else if (braces.isEmpty()) {
                holder.append(current);
            } else {
                result.append(current);
            }
        }

        appendNonEmptyHolder(result, holder);

        return result.toString();
    }

    private static void appendNonEmptyHolder(StringBuilder result, StringBuilder holder) {
        if (!holder.isEmpty()) {
            if (holder.indexOf(" ") != -1) {
                result.append("['").append(holder).append("']");
            } else {
                result.append(holder);
            }
            holder.setLength(0);
        }
    }
}
