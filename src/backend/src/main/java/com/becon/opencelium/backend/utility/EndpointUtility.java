package com.becon.opencelium.backend.utility;

import java.util.*;

public class EndpointUtility {
    private static final String PRE_DIRECT_REF = "{%#";
    private static final String SUF_DIRECT_REF = "%}";
    private static final String PRE_WEBHOOK = "${";
    private static final String SUF_WEBHOOK = "}";

    public static int findIndexOfQuesSign(String endpoint) {
        if (endpoint == null) {
            return -1;
        }
        int idx = endpoint.indexOf('?');
        if (idx == -1) {
            return idx;
        }

        int pre1 = endpoint.indexOf(PRE_DIRECT_REF);
        int pre2 = endpoint.indexOf(PRE_WEBHOOK);
        if (pre1 == -1 && pre2 == -1 || pre1 > idx && pre2 > idx) {
            return idx;
        }

        // Hmm, ok, some ref has '?' sign. Then find exactly '?' sign's place.
        Stack<String> stack = new Stack<>();
        int n = endpoint.length();
        for (int i = 0; i < n; i++) {
            if (stack.empty() && endpoint.charAt(i) == '?') {
                return i;
            }

            if (i + PRE_DIRECT_REF.length() < n && endpoint.startsWith(PRE_DIRECT_REF, i)) {
                stack.push(SUF_DIRECT_REF);
                i += PRE_DIRECT_REF.length() - 1;
            } else if (i + PRE_WEBHOOK.length() < n && endpoint.startsWith(PRE_WEBHOOK, i)) {
                stack.push(SUF_WEBHOOK);
                i += PRE_WEBHOOK.length() - 1;
            } else if (i + SUF_DIRECT_REF.length() < n && endpoint.startsWith(SUF_DIRECT_REF, i)) {
                if (!stack.empty() && stack.peek().equals(SUF_DIRECT_REF)) {
                    stack.pop();
                    i += SUF_DIRECT_REF.length() - 1;
                }
            } else if (i + SUF_WEBHOOK.length() < n && endpoint.startsWith(SUF_WEBHOOK, i)) {
                if (!stack.empty() && stack.peek().equals(SUF_WEBHOOK)) {
                    stack.pop();
                    i += SUF_WEBHOOK.length() - 1;
                }
            }
        }
        return -1;
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

    public static List<String> splitPath(String path) {
        if (path == null || path.isEmpty()) {
            return Collections.emptyList();
        }
        if (path.indexOf('/') == -1) {
            return new ArrayList<>() {{
                add(path);
            }};
        }

        int pre1 = path.indexOf(PRE_DIRECT_REF);
        int pre2 = path.indexOf(PRE_WEBHOOK);
        if (pre1 == -1 && pre2 == -1) {
            return List.of(path.split("/"));
        }

        List<String> res = new ArrayList<>();
        int start = 0;
        Stack<String> stack = new Stack<>();
        int n = path.length();
        for (int i = 0; i < n; i++) {
            if (stack.empty() && path.charAt(i) == '/') {
                res.add(path.substring(start, i));
                start = i + 1;
            } else if (stack.isEmpty() && path.charAt(i) == '?') {
                res.add(path.substring(start, i));
                return res;
            } else if (i + PRE_DIRECT_REF.length() < n && path.startsWith(PRE_DIRECT_REF, i)) {
                stack.push(SUF_DIRECT_REF);
                i += PRE_DIRECT_REF.length() - 1;
            } else if (i + PRE_WEBHOOK.length() < n && path.startsWith(PRE_WEBHOOK, i)) {
                stack.push(SUF_WEBHOOK);
                i += PRE_WEBHOOK.length() - 1;
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
            } else if (i == n - 1) {
                res.add(path.substring(start));
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
                String part = str.substring(idx + PRE_DIRECT_REF.length()-1, sufIdx);
                for (String ref : refs) {
                    if (!part.contains(ref)) {
                        i = sufIdx + SUF_DIRECT_REF.length() - 1;
                        continue out;
                    }
                }
                return str.substring(0, idx) + "{%" + id + "%}" + str.substring(sufIdx + PRE_DIRECT_REF.length());
            }
        }
        return str;
    }
}
