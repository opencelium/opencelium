package com.becon.opencelium.backend.execution.oc721;

import com.becon.opencelium.backend.resource.execution.SchemaDTO;

public interface Extractor {
    SchemaDTO extractValue(String ref);
}
