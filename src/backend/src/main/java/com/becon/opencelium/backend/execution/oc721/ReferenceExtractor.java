package com.becon.opencelium.backend.execution.oc721;

import com.becon.opencelium.backend.execution.ExecutionManager;
import com.becon.opencelium.backend.resource.execution.SchemaDTO;

public class ReferenceExtractor implements Extractor {
    private final ExecutionManager executionManager;

    public ReferenceExtractor(ExecutionManager executionManager) {
        this.executionManager = executionManager;
    }

    @Override
    public SchemaDTO extractValue(String ref) {
        return null;
    }
}
