package com.becon.opencelium.backend.execution.log_managing.commons;

import org.apache.commons.lang3.StringUtils;

import java.util.*;

public class LogParserUtils {

    public static LogEntryType extractEntryType(String line) {
        Map<String, Object> result = extractOutermostProperties(line, Collections.emptySet(), true);
        Object section = result.get(LogPropertyKeys.SECTION);
        if (section != null) {
            return LogEntryType.getByTitleOrElseNull((String) section);
        }
        Object scope = result.get(LogPropertyKeys.SCOPE);
        if (scope != null) {
            return LogEntryType.getByTitleOrElseNull((String) scope);
        }
        return null;
    }

    public static Map<String, Object> extractOutermostProperties(String line, Set<PropDescriptor> props) {
        return extractOutermostProperties(line, props, false);
    }

    public static Map<String, Object> extractOutermostProperties(String line, Set<PropDescriptor> props, boolean onlySectionOrScope) {
        // TODO: handle xml format
        Map<String, Object> result = new HashMap<>();

        String currentProp = null;

        int startCurrentPropIndex = -1;
        int startCurrentPropValueIndex = -1;

        Stack<Character> prefixSuffixStack = new Stack<>();

        char[] chars = line.toCharArray();

        for (int i = 0; i < chars.length; i++) {
            if (i == chars.length - 1) {
                if (currentProp != null && startCurrentPropValueIndex != -1) {
                    if (onlySectionOrScope && (LogPropertyKeys.SECTION.equals(currentProp) || LogPropertyKeys.SCOPE.equals(currentProp))) {
                        return Map.of(currentProp, line.substring(startCurrentPropValueIndex));
                    }
                    checkAndPutToMap(currentProp, line.substring(startCurrentPropValueIndex), result, props);
                }
            }

            if (prefixSuffixStack.isEmpty()) {

                if (chars[i] == '=') {

                    if (startCurrentPropIndex != -1) {

                        if (isData(chars, i - 1)) {
                            checkAndPutToMap(LogPropertyKeys.DATA, line.substring(i + 1), result, props);
                            break;
                        }

                        if (i < chars.length - 1) {
                            if (chars[i + 1] == '"') {
                                prefixSuffixStack.push('"');
                            } else if (chars[i + 1] == '[') {
                                prefixSuffixStack.push(']');
                            } else if (chars[i + 1] == '{') {
                                prefixSuffixStack.push('}');
                            }
                            startCurrentPropValueIndex = i + 1;
                            currentProp = line.substring(startCurrentPropIndex, i);
                            startCurrentPropIndex = -1;
                            i++;
                        } else {
                            checkAndPutToMap(line.substring(startCurrentPropIndex, i), StringUtils.EMPTY, result, props);
                        }
                    }
                } else if (Character.isWhitespace(chars[i])) {
                    if (startCurrentPropValueIndex != -1) {
                        if (onlySectionOrScope && (LogPropertyKeys.SECTION.equals(currentProp) || LogPropertyKeys.SCOPE.equals(currentProp))) {
                            return Map.of(currentProp, line.substring(startCurrentPropValueIndex, i));
                        }
                        checkAndPutToMap(currentProp, line.substring(startCurrentPropValueIndex, i), result, props);
                        startCurrentPropValueIndex = -1;
                    }
                    startCurrentPropIndex = -1;
                    currentProp = null;
                } else if (isValidCharacter(chars[i])) {
                    if (startCurrentPropIndex == -1 && startCurrentPropValueIndex == -1) {
                        startCurrentPropIndex = i;
                    } else if (currentProp != null && startCurrentPropValueIndex == -1) {
                        startCurrentPropValueIndex = i;
                    }
                }
            } else {
                if (chars[i] == '"') {
                    Character peeked = prefixSuffixStack.peek();
                    if (peeked.equals('"')) {
                        checkAndPutToMap(currentProp, line.substring(startCurrentPropValueIndex, i + 1), result, props);
                        startCurrentPropValueIndex = -1;
                        currentProp = null;
                        prefixSuffixStack.pop();
                    }
                } else if (chars[i] == ']') {
                    Character peeked = prefixSuffixStack.peek();
                    if (peeked.equals(']')) {
                        checkAndPutToMap(currentProp, line.substring(startCurrentPropValueIndex, i + 1), result, props);
                        startCurrentPropValueIndex = -1;
                        currentProp = null;
                        prefixSuffixStack.pop();
                    }
                } else if (chars[i] == '}') {
                    Character peeked = prefixSuffixStack.peek();
                    if (peeked.equals('}')) {
                        checkAndPutToMap(currentProp, line.substring(startCurrentPropValueIndex, i + 1), result, props);
                        startCurrentPropValueIndex = -1;
                        currentProp = null;
                        prefixSuffixStack.pop();
                    }
                }
            }
        }

        props.forEach(prop -> {
            if (prop.required() && result.entrySet().stream().noneMatch(x -> prop.key().equals(x.getKey()))) {
                throw LogProcessingException.missingRequiredProperty(prop.key(), line);
            }
        });

        return result;
    }

    private static void checkAndPutToMap(String key, String value, Map<String, Object> result, Set<PropDescriptor> props) {
        props.stream()
                .filter(x -> Objects.equals(x.key(), key))
                .findFirst()
                .ifPresent(x -> result.put(key, x.valueParser().apply(value)));
    }

    private static boolean isValidCharacter(char ch) {
        return Character.isAlphabetic(ch) || Character.isDigit(ch) || ch == '_';
    }

    private static boolean isData(char[] chars, int i) {
        int length = LogPropertyKeys.DATA.length();
        if (i - length >= -1) {
            for (int j = 0; j < length; j++) {
                if (LogPropertyKeys.DATA.charAt(j) != chars[i - length + j + 1]) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }
}