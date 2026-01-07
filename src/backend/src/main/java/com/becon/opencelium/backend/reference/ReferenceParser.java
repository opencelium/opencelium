package com.becon.opencelium.backend.reference;

import com.becon.opencelium.backend.reference.model.DirectReference;
import com.becon.opencelium.backend.reference.model.EnhancementReference;
import com.becon.opencelium.backend.reference.model.PageReference;
import com.becon.opencelium.backend.reference.model.Reference;
import com.becon.opencelium.backend.reference.model.RequestDataReference;
import com.becon.opencelium.backend.reference.model.WebhookReference;
import com.becon.opencelium.backend.reference.model.WrappedDirectReference;

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
}
