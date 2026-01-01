package com.becon.opencelium.backend.reference;

import com.becon.opencelium.backend.reference.model.DirectReference;
import com.becon.opencelium.backend.reference.model.EnhancementReference;
import com.becon.opencelium.backend.reference.model.PageReference;
import com.becon.opencelium.backend.reference.model.Reference;
import com.becon.opencelium.backend.reference.model.RequestDataReference;
import com.becon.opencelium.backend.reference.model.WebhookReference;
import com.becon.opencelium.backend.reference.model.WrappedDirectReference;

import static com.becon.opencelium.backend.constant.RegExpression.directRef;
import static com.becon.opencelium.backend.constant.RegExpression.enhancement;
import static com.becon.opencelium.backend.constant.RegExpression.pageRef;
import static com.becon.opencelium.backend.constant.RegExpression.requestData;
import static com.becon.opencelium.backend.constant.RegExpression.webhook;
import static com.becon.opencelium.backend.constant.RegExpression.wrappedDirectRef;

public class ReferenceParser {
    public static Reference parse(String ref) {
        if (ref.matches(directRef)) {
            return DirectReference.parse(ref);
        } else if (ref.matches(wrappedDirectRef)) {
            return WrappedDirectReference.parse(ref);
        } else if (ref.matches(enhancement)) {
            return EnhancementReference.parse(ref);
        } else if (ref.matches(webhook)) {
            return WebhookReference.parse(ref);
        } else if (ref.matches(pageRef)) {
            return PageReference.parse(ref);
        } else if (ref.matches(requestData)) {
            return RequestDataReference.parse(ref);
        }

        throw new RuntimeException();
    }
}
