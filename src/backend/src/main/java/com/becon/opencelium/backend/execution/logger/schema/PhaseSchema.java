package com.becon.opencelium.backend.execution.logger.schema;

import java.util.List;
import java.util.Map;

public class PhaseSchema {

    private List<String> emitOn;
    private List<String> properties;
    private Map<String, List<String>> segments; // Segment name -> list of keys

    // Getters
    public List<String> getProperties() {
        return properties;
    }

    public Map<String, List<String>> getSegments() {
        return segments;
    }

    public List<String> getEmitOn() {
        return emitOn;
    }
}

