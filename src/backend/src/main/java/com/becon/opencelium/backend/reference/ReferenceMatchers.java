package com.becon.opencelium.backend.reference;

import java.util.regex.Pattern;

import static com.becon.opencelium.backend.constant.RegExpression.directRef;
import static com.becon.opencelium.backend.constant.RegExpression.enhancement;
import static com.becon.opencelium.backend.constant.RegExpression.pageRef;
import static com.becon.opencelium.backend.constant.RegExpression.requestData;
import static com.becon.opencelium.backend.constant.RegExpression.webhook;
import static com.becon.opencelium.backend.constant.RegExpression.wrappedDirectRef;

public final class ReferenceMatchers {

    private ReferenceMatchers() {
    }

    private static final Pattern DIRECT_REF = Pattern.compile(directRef);
    private static final Pattern WRAPPED_DIRECT_REF = Pattern.compile(wrappedDirectRef);
    private static final Pattern ENHANCEMENT_REF = Pattern.compile(enhancement);
    private static final Pattern WEBHOOK_REF = Pattern.compile(webhook);
    private static final Pattern PAGE_REF = Pattern.compile(pageRef);
    private static final Pattern REQUEST_DATA_REF = Pattern.compile(requestData);


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
        // @{} - shortest possible case
        if (ref == null || ref.length() < 3) {
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
}
