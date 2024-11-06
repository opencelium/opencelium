package com.becon.opencelium.backend.ocel.utils;

import com.becon.opencelium.backend.constant.RegExpression;
import com.becon.opencelium.backend.ocel.enums.OperatorEnum;
import com.becon.opencelium.backend.ocel.exceptions.InvalidExpressionException;
import com.becon.opencelium.backend.ocel.operators.Operator;
import com.becon.opencelium.backend.ocel.operators.OperatorFactory;

import java.util.*;

public class Utils {
    private static final Map<String, String> prefixSuffixMap;
    private static final List<String> independentOperators;

    static {
        prefixSuffixMap = new HashMap<>();
        prefixSuffixMap.put("{%#", "%}");
        prefixSuffixMap.put("#{%", "%}");
        prefixSuffixMap.put("${", "}");
        prefixSuffixMap.put("{", "}");
        prefixSuffixMap.put("\"", "\"");
        prefixSuffixMap.put("[", "]");

        independentOperators = new ArrayList<>();
        independentOperators.add(OperatorEnum.AND.getName());
        independentOperators.add(OperatorEnum.OR.getName());
        independentOperators.add(OperatorEnum.GREATER_THAN_OR_EQUAL_TO.getName());
        independentOperators.add(OperatorEnum.GREATER_THAN.getName());
        independentOperators.add(OperatorEnum.LESS_THAN_OR_EQUAL_TO.getName());
        independentOperators.add(OperatorEnum.LESS_THAN.getName());
        independentOperators.add(OperatorEnum.NOT_EQUAL_TO.getName());
        independentOperators.add(OperatorEnum.EQUAL_TO.getName());
        independentOperators.add(OperatorEnum.NOT.getName());
    }

    public static List<String> splitBySpace(String expression) throws InvalidExpressionException {
        char[] chars = expression.toCharArray();
        Stack<String> stack = new Stack<>();
        List<String> res = new ArrayList<>();
        int start = 0;
        for (int i = 0; i < chars.length; i++) {
            if (stack.empty() && chars[i] == ' ') {
                if (i != start && i > 0 && chars[i - 1] != ')') {
                    res.add(expression.substring(start, i));
                }
                start = i + 1;
            } else if (stack.empty() && chars[i] == '(') {
                if (start != i && i > 0 && chars[i - 1] != '(') {
                    res.add(expression.substring(start, i));
                }
                res.add("(");
                start = i + 1;
            } else if (stack.empty() && chars[i] == ')') {
                if (start != i && i > 0 && chars[i - 1] != ')') {
                    res.add(expression.substring(start, i));
                }
                res.add(")");
            } else {
                int inc = processPrefixAndSuffix(chars, i, stack);
                if (inc > 0) {
                    i += inc - 1;
                }
                if (i == chars.length - 1) {
                    if (!stack.empty()) {
                        throw InvalidExpressionException.unexpectedEndOfExpression();
                    }
                    res.add(expression.substring(start));
                }
            }
        }
        return res;
    }

    public static List<String> splitTokens(String expression) throws InvalidExpressionException {
        char[] chars = expression.toCharArray();
        Stack<String> stack = new Stack<>();
        List<String> res = new ArrayList<>();

        int start = 0;
        for (int i = 0; i < chars.length; i++) {
            if (stack.empty() && chars[i] == ' ') {
                if (i != start && i > 0 && chars[i - 1] != ')') {
                    res.add(expression.substring(start, i));
                }
                start = i + 1;
            } else if (stack.empty() && chars[i] == '(') {
                if (start != i && i > 0 && chars[i - 1] != '(') {
                    res.add(expression.substring(start, i));
                }
                res.add("(");
                start = i + 1;
            } else if (stack.empty() && chars[i] == ')') {
                if (start != i && i > 0 && chars[i - 1] != ')') {
                    res.add(expression.substring(start, i));
                }
                res.add(")");
                start = i + 1;
            } else if (stack.empty() && tryToFindOperator(chars, i) != null) {
                String op = tryToFindOperator(chars, i);
                int len = op.length();
                if (start != i)
                    res.add(expression.substring(start, i));
                res.add(op);
                start = i + len;
                i += len - 1;
            } else {
                int inc = processPrefixAndSuffix(chars, i, stack);
                if (inc > 0) {
                    i += inc - 1;
                }
                if (i == chars.length - 1) {
                    if (!stack.empty()) {
                        throw InvalidExpressionException.unexpectedEndOfExpression();
                    }
                    res.add(expression.substring(start));
                }
            }
        }
        return res;
    }

    public static boolean isOperator(String token) {
        return OperatorEnum.fromName(token) != null;
    }

    public static boolean isOperand(String token) {
        return "null".equals(token)
                || "true".equals(token)
                || "false".equals(token)
                || isReference(token)
                || token.startsWith("\"") && token.endsWith("\"")
                || NumberUtils.isNumber(token)
                || token.startsWith("[") && token.endsWith("]")
                || checkTypeAvailability(token);
    }

    public static boolean isValidToken(String token) {
        return ")".equals(token)
                || "(".equals(token)
                || isOperand(token)
                || isOperator(token);
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

    public static Class<?> getClassByType(String type) {
        return switch (type) {
            case "NUM" -> Number.class;
            case "ARR" -> List.class;
            case "OBJ" -> Object.class;
            case "STR" -> String.class;
            case "BOOL" -> Boolean.class;
            default -> null;
        };
    }

    public static boolean checkTypeAvailability(String typeName) {
        return getClassByType(typeName) != null;
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

    private static String tryToFindOperator(char[] chars, int i) {
        for (String op : independentOperators)
            if (startsWith(op, chars, i))
                return op;
        return null;
    }
}
