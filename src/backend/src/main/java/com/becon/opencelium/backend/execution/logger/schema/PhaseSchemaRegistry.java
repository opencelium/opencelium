package com.becon.opencelium.backend.execution.logger.schema;

import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.execution.logger.enums.LogDetailLevel;
import com.becon.opencelium.backend.execution.logger.enums.PhaseCategory;
import com.becon.opencelium.backend.execution.logger.enums.SegmentType;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

public class PhaseSchemaRegistry {
    private Map<LogDetailLevel, Map<PhaseCategory, PhaseSchema>> loadedSchemas = new HashMap<>();

    public PhaseSchemaRegistry() {
        ObjectMapper mapper = new ObjectMapper();

        Path schemaFile = Paths.get(PathConstant.RESOURCES + "/logger/log-schema.json");
        TypeReference<Map<LogDetailLevel, Map<PhaseCategory, PhaseSchema>>> typeRef = new TypeReference<>() {};
        try {
            this.loadedSchemas = mapper.readValue(schemaFile.toFile(), typeRef);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public Map<PhaseCategory, PhaseSchema> getSchema(LogDetailLevel level) {
        return loadedSchemas.get(level);
    }

    public List<String> getSegmentPropertyList(LogDetailLevel level, PhaseCategory phaseCategory, SegmentType segmentType) {
        return getSchema(level).get(phaseCategory).getSegments().getOrDefault(segmentType.name(), List.of());
    }

    public List<String> getPhasePropertyList(LogDetailLevel level, PhaseCategory category) {
        Map<PhaseCategory, PhaseSchema> schemaByPhase = loadedSchemas.get(level);
        if (schemaByPhase == null) {
            return Collections.emptyList(); // No schema for the specified level
        }

        PhaseSchema schema = schemaByPhase.get(category);
        if (schema == null || schema.getProperties() == null) {
            return Collections.emptyList(); // Category not found or has no properties
        }

        return schema.getProperties();
    }

    public Set<String> getAllowedSegments(LogDetailLevel level, PhaseCategory category) {
        Map<PhaseCategory, PhaseSchema> schemaByPhase = loadedSchemas.get(level);
        if (schemaByPhase == null) {
            return Collections.emptySet(); // No schema for this detail level
        }

        PhaseSchema schema = schemaByPhase.get(category);
        if (schema == null || schema.getSegments() == null) {
            return Collections.emptySet(); // No category or no segments defined
        }

        return schema.getSegments().keySet();
    }
}
