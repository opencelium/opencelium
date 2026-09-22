package com.becon.opencelium.backend.reference;

import com.becon.opencelium.backend.reference.enums.ReferenceType;
import com.becon.opencelium.backend.reference.model.*;

import java.util.Optional;

public class ReferenceParser {

    private ReferenceParser() {
    }

    public static Reference parse(String ref) {
        if (ReferenceMatchers.isDirect(ref)) {
            return DirectReference.parse(ref);
        }

        if (ReferenceMatchers.isWrappedDirect(ref)) {
            return WrappedDirectReference.parse(ref);
        }

        if (ReferenceMatchers.isEnhancement(ref)) {
            return EnhancementReference.parse(ref);
        }

        if (ReferenceMatchers.isWebhook(ref)) {
            return WebhookReference.parse(ref);
        }

        if (ReferenceMatchers.isPage(ref)) {
            return PageReference.parse(ref);
        }

        if (ReferenceMatchers.isRequestData(ref)) {
            return RequestDataReference.parse(ref);
        }

        throw new IllegalArgumentException("Unknown reference: " + ref);
    }

    public static Optional<Reference> tryParse(String expression, ReferenceType referenceType) {
        try {
            return switch (referenceType) {
                case WEBHOOK -> Optional.of(WebhookReference.parse(expression));
                case WRAPPED_DIRECT -> Optional.of(WrappedDirectReference.parse(expression));
                case DIRECT -> Optional.of(DirectReference.parse(expression));
                case ENHANCEMENT -> Optional.of(EnhancementReference.parse(expression));
                case PAGE -> Optional.of(PageReference.parse(expression));
                case REQUEST_DATA -> Optional.of(RequestDataReference.parse(expression));
            };
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public static Reference parse(String expression, ReferenceType referenceType) {
        return switch (referenceType) {
            case WEBHOOK -> WebhookReference.parse(expression);
            case WRAPPED_DIRECT -> WrappedDirectReference.parse(expression);
            case DIRECT -> DirectReference.parse(expression);
            case ENHANCEMENT -> EnhancementReference.parse(expression);
            case PAGE -> PageReference.parse(expression);
            case REQUEST_DATA -> RequestDataReference.parse(expression);
        };
    }
}
