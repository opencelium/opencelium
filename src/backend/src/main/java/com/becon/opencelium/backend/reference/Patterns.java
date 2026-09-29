package com.becon.opencelium.backend.reference;

import com.becon.opencelium.backend.reference.enums.ReferenceType;

import java.util.regex.Pattern;

import static com.becon.opencelium.backend.constant.RegExpression.*;
import static com.becon.opencelium.backend.constant.RegExpression.pageRef;
import static com.becon.opencelium.backend.constant.RegExpression.requestData;
import static com.becon.opencelium.backend.constant.RegExpression.webhook;

public interface Patterns {
    Pattern ALL_CONTAINS_PATTERN =
            Pattern.compile(
                    directRef + "|" +
                            wrappedDirectRef + "|" +
                            enhancement + "|" +
                            webhook + "|" +
                            pageRef + "|" +
                            requestData
            );

    Pattern WITHOUT_DIRECT_REF =
            Pattern.compile(
                    enhancement + "|" +
                            webhook + "|" +
                            pageRef + "|" +
                            requestData
            );

    Pattern DIRECT_REF = Pattern.compile(directRef);
    Pattern WRAPPED_DIRECT_REF = Pattern.compile(wrappedDirectRef);
    Pattern ENHANCEMENT_REF = Pattern.compile(enhancement);
    Pattern WEBHOOK_REF = Pattern.compile(webhook);
    Pattern PAGE_REF = Pattern.compile(pageRef);
    Pattern REQUEST_DATA_REF = Pattern.compile(requestData);

    /**
     * Returns the pattern that matches the given reference type.
     */
    static Pattern of(ReferenceType type) {
        return switch (type) {
            case DIRECT -> DIRECT_REF;
            case WRAPPED_DIRECT -> WRAPPED_DIRECT_REF;
            case ENHANCEMENT -> ENHANCEMENT_REF;
            case WEBHOOK -> WEBHOOK_REF;
            case PAGE -> PAGE_REF;
            case REQUEST_DATA -> REQUEST_DATA_REF;
        };
    }
}
