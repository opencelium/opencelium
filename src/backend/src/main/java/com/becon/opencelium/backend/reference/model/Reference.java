package com.becon.opencelium.backend.reference.model;

import com.becon.opencelium.backend.reference.ReferenceType;

public interface Reference {
    ReferenceType getType();
    String getRaw();
}
