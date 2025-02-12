package com.becon.opencelium.backend.ocel.token;

import com.becon.opencelium.backend.ocel.utils.ReferenceUtils;
import com.becon.opencelium.backend.ocel.utils.Utils;
import com.becon.opencelium.backend.ocel.exception.InvalidExpressionException;
import com.becon.opencelium.backend.ocel.function.FunctionEnum;
import com.becon.opencelium.backend.ocel.function.FunctionUtils;
import com.becon.opencelium.backend.ocel.operand.OperandUtils;
import com.becon.opencelium.backend.ocel.operator.OperatorEnum;
import com.becon.opencelium.backend.ocel.operator.OperatorUtils;

import java.util.*;

public class Tokenizer {
    private static final Map<String, String> prefixSuffixMap;

    private Tokenizer() {
    }

    static {
        prefixSuffixMap = new HashMap<>();
        prefixSuffixMap.putAll(ReferenceUtils.getPreSufMap());
        prefixSuffixMap.put("\"", "\"");
        prefixSuffixMap.put("'", "'");
        prefixSuffixMap.put("[", "]");
    }

    /**
     * Splits the given expression into its smallest individual units (tokens).
     * <p>
     * For example, the expression may be broken down into components like:
     * <pre>
     * (, ), 4, "hello", {var}, IS_NULL,
     * current_date(),
     * current_date("Asia/Karachi"),
     * current_date({var}),
     * date_format(current_date("Asia/Karachi"), "yyyy-MM-dd")
     * </pre>
     * </p>
     *
     * This method does not perform validation of the entire expression;
     * it focuses solely on tokenizing the input.
     *
     * <p>An {@code InvalidExpressionException} is thrown with {@code unexpected.end.of.expression} code
     * if and only if a unit that requires a specific ending is incomplete. For example:
     * <pre>
     * "Hello         // Missing closing quote
     * current_date(  // Missing closing parenthesis
     * {var           // Missing closing brace
     * [1,2           // Missing closing square brace
     * </pre>
     * </p>
     */
    public static List<Token> splitTokens(String expression) throws InvalidExpressionException {
        char[] chars = expression.toCharArray();
        List<Token> res = new ArrayList<>();

        String prefix = null;
        int start = 0;
        for (int i = 0; i < chars.length; i++) {
            if (prefix == null && chars[i] == ' ') {
                if (i != start && i > 0 && chars[i - 1] != ')') {
                    res.add(Token.of(expression.substring(start, i), TokenType.OPERAND));
                }
                start = i + 1;
            } else if (prefix == null && chars[i] == '(') {
                if (start != i && i > 0 && chars[i - 1] != '(') {
                    res.add(Token.of(expression.substring(start, i), TokenType.OPERAND));
                }
                res.add(Token.openBrace());
                start = i + 1;
            } else if (prefix == null && chars[i] == ')') {
                if (start != i && i > 0 && chars[i - 1] != ')') {
                    res.add(Token.of(expression.substring(start, i), TokenType.OPERAND));
                }
                res.add(Token.closeBrace());
                start = i + 1;
            } else {
                if (prefix == null) {
                    boolean done = false;

                    String newPre = tryToFindPrefix(chars, i);
                    if (newPre != null) {
                        prefix = newPre;
                        i += newPre.length() - 1;
                        done = true;
                    }

                    if (!done) {
                        OperatorEnum operatorEnum = OperatorUtils.findStartingOperator(chars, i);
                        if (operatorEnum != null) {
                            String op = operatorEnum.getName();
                            int len = op.length();
                            if (start != i)
                                res.add(Token.of(expression.substring(start, i), TokenType.OPERAND));
                            res.add(Token.of(op, TokenType.OPERATOR));
                            start = i + len;
                            i += len - 1;
                            done = true;
                        }
                    }

                    if (!done) {
                        FunctionEnum function = FunctionUtils.findStartingFunction(chars, i);
                        if (function != null) {
                            int end = indexOfFirstOutermostClosingParentheses(chars, i);
                            if (end == -1) {
                                throw InvalidExpressionException.unexpectedEndOfExpression(expression.substring(i));
                            }

                            if (start != i)
                                res.add(Token.of(expression.substring(start, i), TokenType.OPERAND));

                            List<String> expressions = splitParametersOfFunction(chars, i + function.getName().length() + 1, end);
                            List<List<Token>> parameters = new ArrayList<>();
                            for (String token : expressions) {
                                List<Token> tokenizedParam = splitTokens(token);
                                parameters.add(tokenizedParam);
                            }
                            res.add(Token.of(function.getName(), TokenType.FUNCTION, parameters));

                            start = end + 1;
                            i = end;
                        }
                    }
                } else {
                    String suffix = tryToFindSuffix(chars, i, prefix);
                    if (suffix != null) {
                        prefix = null;
                        i += suffix.length() - 1;
                    } else {
                        if (i >= chars.length - 1) {
                            throw InvalidExpressionException.unexpectedEndOfExpression(expression.substring(start));
                        }
                    }
                }

                if (i >= chars.length - 1 && start <= chars.length - 1) {
                    res.add(Token.of(expression.substring(start), TokenType.OPERAND));
                }
            }
        }
        return res;
    }

    private static List<String> splitParametersOfFunction(char[] chars, int start, int end) throws InvalidExpressionException {
        List<String> res = new ArrayList<>();

        String prefix = null;
        int left = start;
        int depth = 0;
        for (int i = start; i < end; i++) {
            if (prefix == null && depth == 0 && chars[i] == ',') {
                res.add(new String(chars, left, i - left));
                left = i + 1;
            } else if (prefix == null && chars[i] == '(') {
                depth++;
            } else if (prefix == null && chars[i] == ')') {
                depth--;
                if (depth < 0) {
                    throw InvalidExpressionException.invalidParentheses();
                }
            } else {
                if (prefix == null) {
                    String newPrefix = tryToFindPrefix(chars, i);
                    if (newPrefix != null) {
                        prefix = newPrefix;
                        i += prefix.length() - 1;
                    } else {
                        if (i >= end - 1) {
                            throw InvalidExpressionException.unexpectedEndOfExpression(new String(chars, start, end));
                        }
                    }
                } else {
                    String suffix = tryToFindSuffix(chars, i, prefix);
                    if (suffix != null) {
                        prefix = null;
                        i += suffix.length() - 1;
                    }
                    if (i >= end - 1 && left != end - 1) {
                        res.add(new String(chars, left, end - left));
                    }
                }
            }
        }
        return res;
    }

    private static int indexOfFirstOutermostClosingParentheses(char[] chars, int startIndex) {
        int depth = 0;
        boolean started = false;
        String prefix = null;
        for (int i = startIndex; i < chars.length; i++) {
            if (prefix == null && chars[i] == '(') {
                depth++;
                started = true;
            } else if (prefix == null && chars[i] == ')') {
                depth--;
                if (started && depth == 0) {
                    return i;
                }
            } else {
                if (prefix == null) {
                    String newPrefix = tryToFindPrefix(chars, i);
                    if (newPrefix != null) {
                        prefix = newPrefix;
                        i += prefix.length() - 1;
                    }
                } else {
                    String suffix = tryToFindSuffix(chars, i, prefix);
                    if (suffix != null) {
                        prefix = null;
                        i += suffix.length() - 1;
                    }
                }
            }
        }
        return -1;
    }

    public static boolean isValidToken(String token) {
        return ")".equals(token) || "(".equals(token)
                || OperandUtils.isOperand(token)
                || OperatorUtils.isOperator(token)
                || FunctionUtils.isFunction(token);
    }

    private static String tryToFindPrefix(char[] chars, int index) {
        for (Map.Entry<String, String> entry : prefixSuffixMap.entrySet()) {
            String pre = entry.getKey();
            if (Utils.startsWith(pre, chars, index)) {
                return pre;
            }
        }
        return null;
    }

    private static String tryToFindSuffix(char[] chars, int index, String prefix) {
        String suffix = prefixSuffixMap.get(prefix);
        return Utils.startsWith(suffix, chars, index) ? suffix : null;
    }
}
