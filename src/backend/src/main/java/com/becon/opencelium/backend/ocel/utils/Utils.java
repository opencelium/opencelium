package com.becon.opencelium.backend.ocel.utils;

import com.becon.opencelium.backend.constant.RegExpression;
import com.becon.opencelium.backend.ocel.enums.OperatorEnum;
import com.becon.opencelium.backend.ocel.operators.Operator;
import com.becon.opencelium.backend.ocel.operators.OperatorFactory;
import com.becon.opencelium.backend.ocel.exceptions.InvalidExpressionException;

import java.util.*;

public class Utils {
    private static final Map<String, String> prefixSuffixMap;

    static {
        prefixSuffixMap = new HashMap<>();
        prefixSuffixMap.put("{%#", "%}");
        prefixSuffixMap.put("#{%", "%}");
        prefixSuffixMap.put("${", "}");
        prefixSuffixMap.put("{", "}");
        prefixSuffixMap.put("\"", "\"");
        prefixSuffixMap.put("[", "]");
    }

    public static List<String> splitBySpace(String expression) throws InvalidExpressionException {
        char[] chars = expression.toCharArray();
        Stack<String> stack = new Stack<>();
        List<String> res = new ArrayList<>();
        int start = 0;
        for (int i = 0; i < chars.length; i++) {
            if (stack.empty() && chars[i] == ' ') {
                if (i > 0 && chars[i - 1] != ')') {
                    res.add(expression.substring(start, i));
                }
                start = i + 1;
            } else if (stack.empty() && chars[i] == '(') {
                if (i > 0 && chars[i - 1] != '(' && start != i) {
                    res.add(expression.substring(start, i));
                }
                res.add("(");
                start = i + 1;
            } else if (stack.empty() && chars[i] == ')') {
                if (i > 0 && chars[i - 1] != ')' && start != i) {
                    res.add(expression.substring(start, i));
                }
                res.add(")");
            } else {
                int inc = processPrefixAndSuffix(chars, i, stack);
                if (i == chars.length - 1) {
                    if (!stack.empty()) {
                        throw new InvalidExpressionException();
                    }
                    res.add(expression.substring(start));
                }
                if (inc > 0) {
                    i += inc - 1;
                }
            }
        }
        return res;
    }

    public static boolean isOperand(String token) {
        return token.equals("null") // null
                || token.equals("true") || token.equals("false") // boolean
                || token.matches(RegExpression.isNumber) // numeric
                || token.matches("\".*\"") // literal
                || token.matches(RegExpression.array) // array
                || token.matches(RegExpression.wrappedDirectRef)
                || token.matches(RegExpression.enhancement)
                || token.matches(RegExpression.requestData)
                || token.matches(RegExpression.webhook);
    }

    public static boolean isOperator(String token) {
        return OperatorEnum.fromName(token) != null;
    }

    public static boolean isReference(String token) {
        return token.matches(RegExpression.wrappedDirectRef)
                || token.matches(RegExpression.enhancement)
                || token.matches(RegExpression.requestData)
                || token.matches(RegExpression.webhook);
    }

    public static Operator getOperator(String token) {
        return OperatorFactory.getOperator(OperatorEnum.fromName(token));
    }

    private static boolean startsWith(String prefix, char[] chars, int i) {
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

    private static int processPrefixAndSuffix(char[] chars, int index, Stack<String> stack) {
        for (Map.Entry<String, String> entry : prefixSuffixMap.entrySet()) {
            String prefix = entry.getKey();
            String suffix = entry.getValue();

            if (stack.empty() && startsWith(prefix, chars, index)) {
                stack.push(suffix);
                return prefix.length();
            }

            if (!stack.empty() && startsWith(suffix, chars, index) && stack.peek().equals(suffix)) {
                stack.pop();
                return suffix.length();
            }
        }
        return 0;
    }
}
