package com.becon.opencelium.backend.reference;

import java.util.regex.Pattern;

import static com.becon.opencelium.backend.constant.RegExpression.directRef;
import static com.becon.opencelium.backend.constant.RegExpression.enhancement;
import static com.becon.opencelium.backend.constant.RegExpression.pageRef;
import static com.becon.opencelium.backend.constant.RegExpression.requestData;
import static com.becon.opencelium.backend.constant.RegExpression.webhook;
import static com.becon.opencelium.backend.constant.RegExpression.wrappedDirectRef;

public class ReferenceDetector {

    private ReferenceDetector() {
    }

    private static final Pattern CONTAINS_PATTERN =
            Pattern.compile(
                    directRef + "|" +
                            wrappedDirectRef + "|" +
                            enhancement + "|" +
                            webhook + "|" +
                            pageRef + "|" +
                            requestData
            );

    public static boolean containsReference(String expression) {
        if (expression == null) {
            return false;
        }

        if (!mayContainReference(expression)) {
            return false;
        }

        return CONTAINS_PATTERN.matcher(expression).find();
    }


    /**
     * Fast pre-check for possible references.
     *
     * <p>All supported reference formats either:
     * <ul>
     *   <li>contain a brace pair {@code {...}} (request data, webhooks, page refs,
     *       wrapped refs, enhancements), or</li>
     *   <li>start with {@code '#'} followed by a fixed-length identifier and a dot
     *       ({@code direct refs}).</li>
     * </ul>
     *
     * <p>For this reason, the check looks for a valid brace pair, or a {@code '#'}
     * that has enough following characters and a dot at the expected position.
     * This is a heuristic filter, not a validator.</p>
     */
    private static boolean mayContainReference(String s) {
        int i, j;

        return ((i = s.indexOf('{')) >= 0 && s.indexOf('}', i + 1) >= 0) || // brace pair
                ((j = s.indexOf('#')) >= 0 && j + 19 <= s.length() && s.charAt(j + 7) == '.'); // direct ref
    }
}
