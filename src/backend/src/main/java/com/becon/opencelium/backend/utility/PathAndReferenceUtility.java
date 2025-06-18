package com.becon.opencelium.backend.utility;

import java.util.*;

import static com.becon.opencelium.backend.constant.RegExpression.referencePath;

public class PathAndReferenceUtility {
    private static final String PRE_DIRECT_REF = "{%#";
    private static final String SUF_DIRECT_REF = "%}";
    private static final String PRE_WEBHOOK = "${";
    private static final String SUF_WEBHOOK = "}";
    private static final String PRE_BRACKET = "['";
    private static final String SUF_BRACKET = "']";

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

    // response example : {{"name": "Obidjon"},{"role":"admin}}
    public static List<String[]> getQueryVariables(String query) {
        if (query == null || query.isEmpty()) {
            return Collections.emptyList();
        }

        int pre1 = query.indexOf(PRE_DIRECT_REF);
        int pre2 = query.indexOf(PRE_WEBHOOK);
        if (pre1 == -1 && pre2 == -1) {
            return Arrays.stream(query.split("&")).map(p -> p.split("=")).toList();
        }

        List<String[]> res = new ArrayList<>();
        int pointer = -1;
        Stack<String> stack = new Stack<>();
        int n = query.length();
        int start = 0;
        for (int i = 0; i < n; i++) {
            if (stack.empty() && query.charAt(i) == '=') {
                String[] pair = new String[2];
                pair[0] = query.substring(start, i);
                res.add(pair);
                pointer++;
                start = i + 1;
            } else if (stack.empty() && query.charAt(i) == '&') {
                String[] pair = res.get(pointer);
                pair[1] = query.substring(start, i);
                start = i + 1;
            } else if (i + PRE_DIRECT_REF.length() < n && query.startsWith(PRE_DIRECT_REF, i)) {
                stack.push(SUF_DIRECT_REF);
                i += PRE_DIRECT_REF.length() - 1;
            } else if (i + PRE_WEBHOOK.length() < n && query.startsWith(PRE_WEBHOOK, i)) {
                stack.push(SUF_WEBHOOK);
                i += PRE_WEBHOOK.length() - 1;
            } else if (i + SUF_DIRECT_REF.length() < n && query.startsWith(SUF_DIRECT_REF, i)) {
                if (!stack.empty() && stack.peek().equals(SUF_DIRECT_REF)) {
                    stack.pop();
                    i += SUF_DIRECT_REF.length() - 1;
                }
            } else if (i + SUF_WEBHOOK.length() < n && query.startsWith(SUF_WEBHOOK, i)) {
                if (!stack.empty() && stack.peek().equals(SUF_WEBHOOK)) {
                    stack.pop();
                    i += SUF_WEBHOOK.length() - 1;
                }
            } else if (i == n - 1) {
                String[] pair = res.get(pointer);
                pair[1] = query.substring(start);
                return res;
            }
        }
        return res;
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
}
