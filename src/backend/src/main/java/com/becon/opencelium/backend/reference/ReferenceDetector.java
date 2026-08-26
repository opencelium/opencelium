package com.becon.opencelium.backend.reference;

import com.becon.opencelium.backend.reference.enums.ReferenceGroup;
import com.becon.opencelium.backend.reference.enums.ReferenceType;

public class ReferenceDetector {
    private ReferenceDetector() {
    }

    public static boolean containsReference(String expression) {
        if (expression == null) {
            return false;
        }

        if (!mayContainReference(expression)) {
            return false;
        }

        return Patterns.ALL_CONTAINS_PATTERN.matcher(expression).find();
    }

    public static boolean containsReference(String expression, ReferenceType referenceType) {
        if (expression == null) {
            return false;
        }

        if (!mayContainReference(expression)) {
            return false;
        }

        return Patterns.of(referenceType).matcher(expression).find();
    }

    public static boolean containsReference(String expression, ReferenceGroup group) {
        if (expression == null) {
            return false;
        }

        if (!mayContainReference(expression)) {
            return false;
        }

        for (ReferenceType reference : group.getReferences()) {
            if (containsReference(expression, reference)) {
                return true;
            }
        }

        return false;
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
