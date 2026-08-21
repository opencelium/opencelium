package com.becon.opencelium.backend.utility;

import com.becon.opencelium.backend.constant.RegExpression;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import org.springframework.http.HttpStatus;

import java.util.Locale;
import java.util.regex.Pattern;

public final class InvokerNameUtils {

    public static final int MAX_LENGTH = 200;

    public static final String INVALID_NAME_ERROR = "INVALID_INVOKER_NAME";

    private static final Pattern NAME_PATTERN = Pattern.compile(RegExpression.INVOKER_NAME_REGEX);
    private static final Pattern WHITESPACES = Pattern.compile("[\\s\\u00A0]+");

    private InvokerNameUtils() {
    }

    /**
     * Trims the name and collapses repeated whitespace into a single space.
     */
    public static String normalize(String name) {
        if (name == null) {
            return null;
        }
        return WHITESPACES.matcher(name).replaceAll(" ").trim();
    }

    /**
     * @return {@code true} if the name complies with the policy once normalized
     */
    public static boolean isValid(String name) {
        String normalized = normalize(name);
        return normalized != null
                && !normalized.isEmpty()
                && normalized.length() <= MAX_LENGTH
                && NAME_PATTERN.matcher(normalized).matches();
    }

    /**
     * Validates the name against the policy and returns it normalized.
     */
    public static String validate(String name) {
        String normalized = normalize(name);
        if (normalized == null || normalized.isEmpty()) {
            throw invalidName("Invoker name must not be empty.");
        }
        if (normalized.length() > MAX_LENGTH) {
            throw invalidName("Invoker name must not exceed " + MAX_LENGTH
                    + " characters, but '" + normalized + "' has " + normalized.length() + ".");
        }
        if (!NAME_PATTERN.matcher(normalized).matches()) {
            throw invalidName("Invoker name '" + normalized + "' is not allowed. Use letters, digits, spaces, "
                    + "'-', '_', '(' and ')'. A dot is allowed only inside the name and not twice in a row.");
        }
        return normalized;
    }

    /**
     * @return the form used to compare two invoker names, i.e. normalized and lower-cased
     */
    public static String canonical(String name) {
        String normalized = normalize(name);
        return normalized == null ? null : normalized.toLowerCase(Locale.ROOT);
    }

    /**
     * @return {@code true} if both names denote the same invoker, ignoring case and extra whitespace
     */
    public static boolean sameName(String left, String right) {
        String canonicalLeft = canonical(left);
        return canonicalLeft != null && canonicalLeft.equals(canonical(right));
    }

    private static GeneralServiceException invalidName(String message) {
        return new GeneralServiceException(HttpStatus.BAD_REQUEST, INVALID_NAME_ERROR, message);
    }
}
