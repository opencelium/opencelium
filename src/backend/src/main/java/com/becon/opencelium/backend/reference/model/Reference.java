package com.becon.opencelium.backend.reference.model;

import com.becon.opencelium.backend.reference.enums.ReferenceType;

public sealed interface Reference permits DirectReference, WrappedDirectReference, EnhancementReference, WebhookReference, PageReference, GlobalReference, RequestDataReference {
    ReferenceType getType();
    String getRaw();
}
