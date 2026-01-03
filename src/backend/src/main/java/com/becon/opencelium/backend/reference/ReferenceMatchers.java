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
        return ref != null && DIRECT_REF.matcher(ref).matches();
    }

    public static boolean isWrappedDirect(String ref) {
        return ref != null && WRAPPED_DIRECT_REF.matcher(ref).matches();
    }

    public static boolean isEnhancement(String ref) {
        return ref != null && ENHANCEMENT_REF.matcher(ref).matches();
    }

    public static boolean isWebhook(String ref) {
        return ref != null && WEBHOOK_REF.matcher(ref).matches();
    }

    public static boolean isPage(String ref) {
        return ref != null && PAGE_REF.matcher(ref).matches();
    }

    public static boolean isRequestData(String ref) {
        return ref != null && REQUEST_DATA_REF.matcher(ref).matches();
    }
}
