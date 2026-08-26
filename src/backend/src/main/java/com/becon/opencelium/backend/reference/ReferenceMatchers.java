package com.becon.opencelium.backend.reference;

import com.becon.opencelium.backend.reference.enums.ReferenceGroup;
import com.becon.opencelium.backend.reference.enums.ReferenceType;

import static com.becon.opencelium.backend.reference.Patterns.*;

/**
 * Low-level reference classifiers.
 *
 * <p>These methods perform fast, positional checks (charAt-based)
 * before applying regex validation. They are intentionally
 * low-level and performance-oriented.
 */
public final class ReferenceMatchers {

    private ReferenceMatchers() {
    }

    public static boolean isDirect(String ref) {
        // #ababab.(request).x - shortest possible case
        if (ref == null || ref.length() < 19) {
            return false;
        }

        if (ref.charAt(0) != '#' || ref.charAt(7) != '.') {
            return false;
        }

        return DIRECT_REF.matcher(ref).matches();
    }

    public static boolean isWrappedDirect(String ref) {
        // {%#ababab.(request).x%} - shortest possible case
        if (ref == null || ref.length() < 23) {
            return false;
        }

        if (ref.charAt(0) != '{' || ref.charAt(1) != '%' || ref.charAt(2) != '#'
                || ref.charAt(ref.length() - 2) != '%' || ref.charAt(ref.length() - 1) != '}'
        ) {
            return false;
        }

        return WRAPPED_DIRECT_REF.matcher(ref).matches();
    }

    public static boolean isEnhancement(String ref) {
        // "#{%<24-hex>%}" - fixed length
        if (ref == null || ref.length() != 29) {
            return false;
        }

        if (ref.charAt(0) != '#' || ref.charAt(1) != '{' || ref.charAt(2) != '%'
                || ref.charAt(27) != '%' || ref.charAt(28) != '}'
        ) {
            return false;
        }

        return ENHANCEMENT_REF.matcher(ref).matches();
    }

    public static boolean isWebhook(String ref) {
        // ${} - shortest possible case
        if (ref == null || ref.length() < 3) {
            return false;
        }

        if (ref.charAt(0) != '$' || ref.charAt(1) != '{' || ref.charAt(ref.length() - 1) != '}') {
            return false;
        }

        return WEBHOOK_REF.matcher(ref).matches();
    }

    public static boolean isPage(String ref) {
        // @{x} - shortest possible case
        if (ref == null || ref.length() < 4) {
            return false;
        }

        if (ref.charAt(0) != '@' || ref.charAt(1) != '{' || ref.charAt(ref.length() - 1) != '}') {
            return false;
        }

        return PAGE_REF.matcher(ref).matches();
    }

    public static boolean isRequestData(String ref) {
        // {} - shortest possible case
        if (ref == null || ref.length() < 2) {
            return false;
        }

        if (ref.charAt(0) != '{' || ref.charAt(ref.length() - 1) != '}') {
            return false;
        }

        return REQUEST_DATA_REF.matcher(ref).matches();
    }

    public static boolean isReference(String ref, ReferenceGroup group) {
        for (ReferenceType type : group.getReferences()) {
            if (isThatReference(ref, type)) {
                return true;
            }
        }
        return false;
    }

    private static boolean isThatReference(String ref, ReferenceType type) {
        return switch (type) {
            case ENHANCEMENT -> isEnhancement(ref);
            case PAGE -> isPage(ref);
            case REQUEST_DATA -> isRequestData(ref);
            case DIRECT -> isDirect(ref);
            case WEBHOOK -> isWebhook(ref);
            case WRAPPED_DIRECT -> isWrappedDirect(ref);
        };
    }
}
