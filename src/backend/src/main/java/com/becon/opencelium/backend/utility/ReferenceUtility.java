package com.becon.opencelium.backend.utility;

import java.util.ArrayList;
import java.util.List;
import java.util.Stack;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.becon.opencelium.backend.constant.RegExpression.enhancement;
import static com.becon.opencelium.backend.constant.RegExpression.pageRef;
import static com.becon.opencelium.backend.constant.RegExpression.requestData;
import static com.becon.opencelium.backend.constant.RegExpression.webhook;
import static com.becon.opencelium.backend.constant.RegExpression.wrappedDirectRef;


public class ReferenceUtility {

    public static final String IS_FOR_IN_KEY_TYPE = "\\['(.*?)\\']~";
    public static final String IS_FOR_IN_VALUE_TYPE = "\\['(.*?)\\']";
    public static final String IS_SPLIT_STRING_TYPE = "\\[([a-z0-9*]+)\\]~";
    public static final String ARRAY_LETTER_INDEX = "\\[([a-z])\\]";

    public static String getContainedReferenceAndType(String expression) {
        if (expression == null) {
            return "No reference found";
        }

        String res = extractRef(expression, wrappedDirectRef);
        if (res != null) {
            return "direct ref(" + res + ")";
        }

        res = extractRef(expression, enhancement);
        if (res != null) {
            return "enhancement(" + res + ")";
        }

        res = extractRef(expression, webhook);
        if (res != null) {
            return "webhook(" + res + ")";
        }

        res = extractRef(expression, pageRef);
        if (res != null) {
            return "page(" + res + ")";
        }

        res = extractRef(expression, requestData);
        if (res != null) {
            return "request data(" + res + ")";
        }

        return "No reference found(" + res + ")";
    }

    public static String extractRef(String value, String type) {
        Pattern pattern = Pattern.compile(type);
        Matcher matcher = pattern.matcher(value);

        if (matcher.find()) {
            return matcher.group();
        }

        return null;
    }

    public static String extractDirectRef(String ref) {
        // '{%#ababab.(response).body.$.field[*]%}'
        if (ref.startsWith("{%") && ref.endsWith("%}")) {
            ref = ref.substring(2, ref.length() - 2);
        }

        // '#ababab.(response).body.$.field[*]'
        // '#ababab.(request).body.$.field[*]'
        return ref;
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
        if (paths.isEmpty()) {
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

    public static String getPointerToBody(String ref, int partCount, String remove) {
        String[] refParts = splitPaths(ref);

        String result = "";
        for (int i = 0; i < partCount - 1; i++) {
            result += refParts[i] + ".";
        }

        result += refParts[partCount - 1].replace(remove, "");

        return result;
    }

    public static boolean equals(String ref1, String ref2) {
        String[] actualRefParts = ref1.split("\\.");
        String[] potentialRefParts = ref2.split("\\.");

        // 'reference' should contain 'ref' as it is a specific part of it:
        if (actualRefParts.length > potentialRefParts.length) {
            return false;
        }

        String part;
        for (int i = 0; i < actualRefParts.length; i++) {
            // if 'part' contains index then remove it, otherwise take whole part
            if (actualRefParts[i].contains("[")) {
                part = actualRefParts[i].substring(0, actualRefParts[i].indexOf('['));
            } else {
                part = actualRefParts[i];
            }

            // 'potentialRefParts[i]' should contain part
            if (!potentialRefParts[i].contains(part)) {
                return false;
            }
        }

        return true;
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
