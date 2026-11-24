package com.becon.opencelium.backend.utility;

import org.apache.commons.lang3.StringUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.util.*;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.becon.opencelium.backend.constant.RegExpression.referencePath;

public class PathAndReferenceUtility {
    /**
     * Every reference that can appear inside text, matched as short as possible so that two
     * references in one text are never merged: wrapped direct reference, enhancement, webhook,
     * page reference and request data.
     */
    private static final Pattern REFERENCE_SPAN = Pattern.compile(
            "\\{%#[a-zA-Z0-9]{6}\\.\\((?:response|request)\\)\\..+?%\\}"
                    + "|#\\{%[0-9a-fA-F]{24}%\\}"
                    + "|\\$\\{[^}]*\\}"
                    + "|@\\{[^}]+\\}"
                    + "|\\{(?!%)[^{}]*(?<!%)\\}");
    private static final String PRE_DIRECT_REF = "{%#";
    private static final String SUF_DIRECT_REF = "%}";
    private static final String PRE_WEBHOOK = "${";
    private static final String SUF_WEBHOOK = "}";
    private static final String PRE_BRACKET = "['";
    private static final String SUF_BRACKET = "']";
    private static final EmptyQueryValuePolicy EMPTY_QUERY_VALUE_POLICY = EmptyQueryValuePolicy.SET_EMPTY;
    private static final Logger log = LogManager.getLogger(PathAndReferenceUtility.class);

    public static int indexOf(String path, char ch, boolean hasWebHook, boolean hasDirectRef) {
        return indexOf(path, ch, true, hasWebHook, hasDirectRef);
    }

    public static int indexOf(String path, char ch, boolean hasBracket, boolean hasWebhook, boolean hasDirectRef) {
        if (path == null) {
            return -1;
        }
        int idx = path.indexOf(ch);
        if (idx == -1) {
            return idx;
        }

        int pre1 = path.indexOf(PRE_DIRECT_REF);
        int pre2 = path.indexOf(PRE_WEBHOOK);
        int pre3 = path.indexOf(PRE_BRACKET);
        if ((!hasDirectRef || pre1 == -1)
                && (!hasWebhook || pre2 == -1)
                && (!hasBracket || pre3 == -1)
                ||
                (!hasDirectRef || pre1 > idx)
                        && (!hasWebhook || pre2 > idx)
                        && (!hasBracket || pre3 > idx)) {
            return idx;
        }

        Stack<String> stack = new Stack<>();
        int n = path.length();
        for (int i = 0; i < n; i++) {
            if (stack.empty() && path.charAt(i) == ch) {
                return i;
            }

            if (hasDirectRef && i + PRE_DIRECT_REF.length() < n && path.startsWith(PRE_DIRECT_REF, i)) {
                stack.push(SUF_DIRECT_REF);
                i += PRE_DIRECT_REF.length() - 1;
            } else if (hasWebhook && i + PRE_WEBHOOK.length() < n && path.startsWith(PRE_WEBHOOK, i)) {
                stack.push(SUF_WEBHOOK);
                i += PRE_WEBHOOK.length() - 1;
            } else if (hasBracket && i + PRE_BRACKET.length() < n && path.startsWith(PRE_BRACKET, i)) {
                stack.push(SUF_BRACKET);
                i += PRE_BRACKET.length() - 1;
            } else if (hasDirectRef && i + SUF_DIRECT_REF.length() < n && path.startsWith(SUF_DIRECT_REF, i)) {
                if (!stack.empty() && stack.peek().equals(SUF_DIRECT_REF)) {
                    stack.pop();
                    i += SUF_DIRECT_REF.length() - 1;
                }
            } else if (hasWebhook && i + SUF_WEBHOOK.length() < n && path.startsWith(SUF_WEBHOOK, i)) {
                if (!stack.empty() && stack.peek().equals(SUF_WEBHOOK)) {
                    stack.pop();
                    i += SUF_WEBHOOK.length() - 1;
                }
            } else if (hasBracket && i + SUF_BRACKET.length() < n && path.startsWith(SUF_BRACKET, i)) {
                if (!stack.empty() && stack.peek().equals(SUF_BRACKET)) {
                    stack.pop();
                    i += SUF_BRACKET.length() - 1;
                }
            }
        }
        return -1;
    }

    public static int findIndexOfQuesSign(String endpoint) {
        return indexOf(endpoint, '?', false, true, true);
    }

    /**
     * Parses a query string into a list of key-value pairs. A {@code '&'} or {@code '='} inside a
     * reference ({@link #findReferenceSpans(String)}) does not split the query.
     *
     * <p>Example:</p>
     * <pre>
     *
     * query = "name=Obidjon&role=admin"
     * result = [["name", "Obidjon"], ["role", "admin"]]
     *
     * query = "name={%#ffffff.(response).name%}&password=${random=&$}&flag&q="
     * result = [["name", "{%#ffffff.(response).name%}"], ["password", "${random=&$}"], ["flag", null], ["q", ""]]
     * </pre>
     *
     * @param query the query string to parse (may contain references or plain key-value pairs).
     * @return a list of string arrays, where each array has exactly two elements: key and value.
     *         The value is {@code null} for a part without {@code '='}, and an empty value is
     *         handled by the empty query value policy.
     */
    public static List<String[]> getQueryVariables(String query) {
        if (query == null || query.isEmpty()) {
            return Collections.emptyList();
        }

        List<String[]> result = new ArrayList<>();

        for (String part : splitOutsideReferences(query, '&')) {
            if (part.isEmpty()) {
                continue;
            }

            int separator = indexOfOutsideReferences(part, '=');
            if (separator == -1) {
                // a part without '=', such as 'flag'
                result.add(new String[]{part, null});
                continue;
            }

            String key = part.substring(0, separator);
            if (StringUtils.isBlank(key)) {
                throw new RuntimeException("Invalid query parameter: " + part);
            }

            String value = part.substring(separator + 1);
            result.add(new String[]{key, StringUtils.isBlank(value) ? EMPTY_QUERY_VALUE_POLICY.apply(key) : value});
        }

        return result;
    }

    public static String bindExactlyPlace(String str, List<String> refs, String id) {
        int length = str.length();
        out:
        for (int i = 0; i < length; i++) {
            if (str.startsWith(PRE_DIRECT_REF, i)) {
                int sufIdx = str.indexOf(SUF_DIRECT_REF, i);
                if (sufIdx == -1) {
                    return str;
                }
                int idx = str.indexOf(PRE_DIRECT_REF, i);
                String part = str.substring(idx + PRE_DIRECT_REF.length() - 1, sufIdx);
                for (String ref : refs) {
                    if (!part.contains(ref)) {
                        i = sufIdx + SUF_DIRECT_REF.length() - 1;
                        continue out;
                    }
                }
                return str.substring(0, idx) + "{%" + id + "%}" + str.substring(sufIdx + SUF_DIRECT_REF.length());
            }
        }
        return str;
    }

    public static List<String> splitByDelimiter(String path, char delim) {
        return splitByDelimiter(path, delim, false, false);
    }

    public static List<String> splitByDelimiter(String path, char delim, boolean hasBracket, boolean returnOpenedBracket) {
        if (path == null || path.isEmpty()) {
            return Collections.emptyList();
        }
        if (path.indexOf(delim) == -1) {
            return new ArrayList<>() {{
                add(path);
            }};
        }

        int pre1 = path.indexOf(PRE_DIRECT_REF);
        int pre2 = path.indexOf(PRE_WEBHOOK);
        int pre3 = path.indexOf(PRE_BRACKET);
        if (pre1 == -1 && pre2 == -1 && pre3 == -1) {
            String[] split = path.split((isSpecialRegexChar(delim) ? "\\" : "") + delim);
            ArrayList<String> res = new ArrayList<>();
            for (int i = 0; i < split.length; i++) {
                String s = split[i];
                if (s.matches("\\[.*]")) {
                    if (res.isEmpty()) {
                        res.add(s);
                    } else {
                        res.set(i - 1, res.get(i - 1) + s);
                    }
                } else {
                    res.add(s);
                }
            }
            return res;
        }

        List<String> res = new ArrayList<>();
        int start = 0;
        Stack<String> stack = new Stack<>();
        int n = path.length();
        for (int i = 0; i < n; i++) {
            if (stack.empty() && path.charAt(i) == delim) {
                if (hasBracket) {
                    List<String> subParts = parseBracketNotationPath(path.substring(start, i));
                    if (subParts.size() > 1) {
                        res.addAll(subParts);
                    } else {
                        if (subParts.get(0).matches("\\[.*]")) {
                            if (!res.isEmpty()) {
                                res.set(res.size() - 1, res.get(res.size() - 1) + subParts.get(0));
                            } else {
                                res.add(subParts.get(0));
                            }
                        } else {
                            res.add(subParts.get(0));
                        }
                    }
                } else {
                    String val = path.substring(start, i);
                    if (val.matches("\\[.*]")) {
                        if (!res.isEmpty()) {
                            res.set(res.size() - 1, res.get(res.size() - 1) + val);
                        } else {
                            res.add(val);
                        }
                    } else {
                        res.add(val);
                    }
                }
                start = i + 1;
            } else if (i + PRE_DIRECT_REF.length() < n && path.startsWith(PRE_DIRECT_REF, i)) {
                stack.push(SUF_DIRECT_REF);
                i += PRE_DIRECT_REF.length() - 1;
            } else if (i + PRE_WEBHOOK.length() < n && path.startsWith(PRE_WEBHOOK, i)) {
                stack.push(SUF_WEBHOOK);
                i += PRE_WEBHOOK.length() - 1;
            } else if (i + PRE_BRACKET.length() < n && path.startsWith(PRE_BRACKET, i)) {
                stack.push(SUF_BRACKET);
                i += PRE_BRACKET.length() - 1;
            } else if (i + SUF_DIRECT_REF.length() < n && path.startsWith(SUF_DIRECT_REF, i)) {
                if (!stack.empty() && stack.peek().equals(SUF_DIRECT_REF)) {
                    stack.pop();
                    i += SUF_DIRECT_REF.length() - 1;
                }
            } else if (i + SUF_WEBHOOK.length() < n && path.startsWith(SUF_WEBHOOK, i)) {
                if (!stack.empty() && stack.peek().equals(SUF_WEBHOOK)) {
                    stack.pop();
                    i += SUF_WEBHOOK.length() - 1;
                }
            } else if (i + SUF_BRACKET.length() < n && path.startsWith(SUF_BRACKET, i)) {
                if (!stack.isEmpty() && stack.peek().equals(SUF_BRACKET)) {
                    stack.pop();
                    i += SUF_BRACKET.length() - 1;
                }
            } else if (i == n - 1) {
                if (hasBracket) {
                    List<String> subParts = parseBracketNotationPath(path.substring(start));
                    if (subParts.size() > 1) {
                        res.addAll(subParts);
                    } else {
                        if (subParts.get(0).matches("\\[.*]")) {
                            if (!res.isEmpty()) {
                                res.set(res.size() - 1, res.get(res.size() - 1) + subParts.get(0));
                            } else {
                                res.add(subParts.get(0));
                            }
                        } else {
                            res.add(subParts.get(0));
                        }
                    }
                } else {
                    String val = path.substring(start);
                    if (val.matches("\\[.*]")) {
                        if (!res.isEmpty()) {
                            res.set(res.size() - 1, res.get(res.size() - 1) + val);
                        } else {
                            res.add(val);
                        }
                    } else {
                        res.add(val);
                    }
                }
            }
        }

        return returnOpenedBracket
                ? openWrappedBrackets(res)
                : res;
    }

    /**
     * Finds every reference in the given text, in order of appearance.
     *
     * <p>Example:</p>
     * <pre>
     * text = "{url}/users/{%#ffffff.(response).id%}"
     * result = [[0, 5], [12, 37]]
     * </pre>
     *
     * @return start (inclusive) and end (exclusive) index of each reference, never null
     */
    public static List<int[]> findReferenceSpans(String text) {
        if (text == null || text.isEmpty()) {
            return Collections.emptyList();
        }

        List<int[]> spans = new ArrayList<>();
        Matcher matcher = REFERENCE_SPAN.matcher(text);
        while (matcher.find()) {
            spans.add(new int[]{matcher.start(), matcher.end()});
        }

        return spans;
    }

    /**
     * Returns the index of the first {@code ch} that is not inside a reference, or -1.
     */
    public static int indexOfOutsideReferences(String text, char ch) {
        if (text == null) {
            return -1;
        }

        List<int[]> spans = findReferenceSpans(text);
        int spanIndex = 0;
        for (int i = 0; i < text.length(); i++) {
            if (spanIndex < spans.size() && i == spans.get(spanIndex)[0]) {
                i = spans.get(spanIndex)[1] - 1;
                spanIndex++;
            } else if (text.charAt(i) == ch) {
                return i;
            }
        }

        return -1;
    }

    /**
     * Splits the given text on every {@code delimiter} that is not inside a reference. Empty
     * parts are kept, so joining the parts with the delimiter gives back the text.
     */
    public static List<String> splitOutsideReferences(String text, char delimiter) {
        if (text == null) {
            return Collections.emptyList();
        }

        List<int[]> spans = findReferenceSpans(text);
        List<String> parts = new ArrayList<>();
        int spanIndex = 0;
        int start = 0;
        for (int i = 0; i < text.length(); i++) {
            if (spanIndex < spans.size() && i == spans.get(spanIndex)[0]) {
                i = spans.get(spanIndex)[1] - 1;
                spanIndex++;
            } else if (text.charAt(i) == delimiter) {
                parts.add(text.substring(start, i));
                start = i + 1;
            }
        }
        parts.add(text.substring(start));

        return parts;
    }

    /**
     * Extracts the start and end indexes of all direct references found in the given text.
     *
     * <p>Example:</p>
     * <pre>
     * text = "Hello {%#ffffff.(request).name%}"
     * result = [[6, 19]]
     * </pre>
     */
    public static List<int[]> extractReferenceIndexes(String text) {
        if (text == null || text.isEmpty()) {
            return Collections.emptyList();
        }

        if (!text.contains(PRE_DIRECT_REF)) {
            return Collections.emptyList();
        }

        List<int[]> result = new ArrayList<>();
        Stack<Integer> stack = new Stack<>();
        int n = text.length();

        for (int i = 0; i < n; i++) {
            if (i + PRE_DIRECT_REF.length() <= n && text.startsWith(PRE_DIRECT_REF, i)) {
                stack.push(i);
                i += PRE_DIRECT_REF.length() - 1;
            }else if (i + SUF_DIRECT_REF.length() <= n && text.startsWith(SUF_DIRECT_REF, i)) {
                if (!stack.isEmpty()) {
                    int startIdx = stack.pop();
                    if (text.startsWith(PRE_DIRECT_REF, startIdx)) {
                        result.add(new int[]{startIdx, i + SUF_DIRECT_REF.length()});
                    }
                }
                i += SUF_DIRECT_REF.length() - 1;
            }
        }

        return result;
    }

    public static List<String> parseBracketNotationPath(String path) {
        if (path == null || path.isEmpty()) {
            return Collections.emptyList();
        }

        if (!path.contains(PRE_BRACKET)) {
            return Collections.singletonList(path);
        }

        int len = path.length();
        List<String> res = new ArrayList<>();
        int start = -1;

        for (int i = 0; i < len; i++) {
            if (i + PRE_BRACKET.length() < len && path.startsWith(PRE_BRACKET, i)) {
                start = i;
                i += PRE_BRACKET.length() - 1;
            } else if (i + SUF_BRACKET.length() < len && path.startsWith(SUF_BRACKET, i) && start != -1) {
                res.add(path.substring(start, i + SUF_BRACKET.length()));
                start = -1;
                i += SUF_BRACKET.length() - 1;
            } else if (i == len - 1) {
                res.add(path.substring(start));
            }
        }
        return res;
    }

    public static boolean startsWith(String path, String prefix) {
        if (path.startsWith(PRE_BRACKET) && path.endsWith(SUF_BRACKET)) {
            return path.startsWith(PRE_BRACKET + prefix);
        }
        return path.startsWith(prefix);
    }

    private static boolean isSpecialRegexChar(char delim) {
        String specialChars = ".^$*+?()[]{}\\|/";
        return specialChars.indexOf(delim) != -1;
    }

    public static boolean isBody(String path) {
        return path != null && path.startsWith("body.$.");
    }

    public static boolean isHeader(String path) {
        return path != null && path.startsWith("header.$.");
    }

    public static String getActualPathOfBody(String path) {
        return path.substring(7);
    }

    public static String getHeaderParameterName(String path) {
        return path.substring(9);
    }

    public static String getPlaceTypeOfRef(String field) {
        return field == null ? null
                : !field.matches(referencePath) ? null
                : field.equals("path") ? field
                : isBody(field) ? "body"
                : isHeader(field) ? "header"
                : null;
    }

    public static String rebuildReference(String color, String type, String field) {
        return color + ".(" + type + ")" + (field == null ? "" : "." + field);
    }

    /**
     * Input : [['address.street'], id, name]
     * <p>
     * Output : [address.street, id, name]
     */
    private static List<String> openWrappedBrackets(List<String> parts) {
        return parts.stream()
                .map(PathAndReferenceUtility::openWrappedBracket)
                .toList();
    }

    /**
     * Input : ['address.street']
     * Output : address.street
     * <p>
     * Input : name
     * Output : name
     */
    private static String openWrappedBracket(String path) {
        return path.startsWith(PRE_BRACKET) && path.endsWith(SUF_BRACKET)
                ? path.substring(PRE_BRACKET.length(), path.length() - SUF_BRACKET.length())
                : path;
    }

    /**
     * Defines policies for handling cases where a query value is empty.
     * <p>
     * Each policy provides a different strategy through a {@link Function}
     * that takes the original (possibly empty) value and returns a replacement,
     * or throws an exception.
     * </p>
     *
     * <ul>
     *   <li>{@link #SET_EMPTY} – Replaces the value with an empty string.</li>
     *   <li>{@link #FAIL} – Throws a {@link RuntimeException} when the value is empty.</li>
     *   <li>{@link #WARNING} – Logs a warning and replaces the value with an empty string.</li>
     * </ul>
     */
    enum EmptyQueryValuePolicy {

        /**
         * Always replace the query value with an empty string.
         * <p>
         * This is a safe option when empty values are allowed
         * but should be normalized to a blank string.
         * </p>
         */
        SET_EMPTY(x -> StringUtils.EMPTY),

        /**
         * Fail immediately by throwing a {@link RuntimeException}
         * if the query value is empty.
         * <p>
         * Use this when empty query values are not permitted
         * and should cause the process to stop.
         * </p>
         */
        FAIL(x -> {
            throw new RuntimeException("Query value cannot be empty : %s".formatted(x));
        }),

        /**
         * Log a warning message when the query value is empty,
         * and return an empty string instead.
         * <p>
         * Useful when you want to allow empty values but still
         * keep track of them for troubleshooting.
         * </p>
         */
        WARNING(x -> {
            log.warn("Query value cannot be empty : {}", x);

            return StringUtils.EMPTY;
        });

        /**
         * The function that implements the policy behavior.
         */
        private final Function<String, String> function;

        EmptyQueryValuePolicy(Function<String, String> function) {
            this.function = function;
        }

        public String apply(String key) {
            return function.apply(key);
        }
    }

}
