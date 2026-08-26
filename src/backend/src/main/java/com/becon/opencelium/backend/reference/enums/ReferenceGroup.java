package com.becon.opencelium.backend.reference.enums;

import java.util.Set;

public enum ReferenceGroup {
    WRAPPED(Set.of(ReferenceType.WRAPPED_DIRECT, ReferenceType.ENHANCEMENT, ReferenceType.WEBHOOK, ReferenceType.REQUEST_DATA)),
    DIRECT_WITHOUT_PAGE(Set.of(ReferenceType.DIRECT, ReferenceType.ENHANCEMENT, ReferenceType.WEBHOOK, ReferenceType.REQUEST_DATA));

    private final Set<ReferenceType> references;

    ReferenceGroup(Set<ReferenceType> references) {
        this.references = references;
    }

    public Set<ReferenceType> getReferences() {
        return references;
    }
}
