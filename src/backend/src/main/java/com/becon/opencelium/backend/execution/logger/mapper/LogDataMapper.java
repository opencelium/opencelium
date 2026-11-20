package com.becon.opencelium.backend.execution.logger.mapper;

import com.becon.opencelium.backend.database.mongodb.entity.LogDataMng;
import com.becon.opencelium.backend.database.mongodb.entity.LogDataError;
import com.becon.opencelium.backend.database.mongodb.entity.LogGlobalSnapshotEntry;
import com.becon.opencelium.backend.execution.logger.dto.ErrorInfoDTO;
import com.becon.opencelium.backend.execution.logger.dto.GlobalSnapshotEntryDTO;
import com.becon.opencelium.backend.execution.logger.dto.LogDataDTO;
import com.becon.opencelium.backend.execution.logger.keys.LogLineKey;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.TextNode;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class LogDataMapper {
    private static final ObjectMapper JSON = new ObjectMapper();

    /**
     * Map a LogData entity to its DTO.
     */
    public LogDataDTO toDto(LogDataMng src) {
        LogDataDTO dto = new LogDataDTO();

        dto.setId(src.getId());
        dto.setExecutionId(src.getExecutionId());
        dto.setFlowId(src.getFlowId());
        dto.setIndexPath(src.getIndexPath());
        dto.setStatus(src.getStatus());
        dto.setType(src.getType());
        dto.setConnectorName(src.getConnectorName());

        // Filter only top-level properties (excluding segments and error fields)
        Map<String, Object> allProps = src.getProperties();
        Map<String, Object> allSegments = src.getSegments();
        Map<String, Object> baseProps = new LinkedHashMap<>();
        Map<String, Object> baseSegments = new LinkedHashMap<>();

        for (Map.Entry<String, Object> entry : allProps.entrySet()) {
            String key = entry.getKey();
            baseProps.put(key, entry.getValue());
        }

        for (Map.Entry<String, Object> entry : allSegments.entrySet()) {
            String key = entry.getKey();
            baseSegments.put(key, entry.getValue());
        }
        dto.setError(buildErrorInfo(src.getError()));
        dto.setProperties(baseProps);
        dto.setSegment(baseSegments);
        dto.setGlobalSnapshot(toGlobalSnapshotDto(src.getGlobalSnapshot()));
        // Handle exception segment separately
        return dto;
    }

    /**
     * Returns the global snapshot of an EXECUTION element, or {@code null} when the element has
     * none: any other element, a run still going, or a run logged before the snapshot was part
     * of the log.
     */
    private static List<GlobalSnapshotEntryDTO> toGlobalSnapshotDto(List<LogGlobalSnapshotEntry> entries) {
        if (entries == null) {
            return null;
        }

        return entries.stream()
                .map(LogDataMapper::toGlobalSnapshotEntryDto)
                .toList();
    }

    private static GlobalSnapshotEntryDTO toGlobalSnapshotEntryDto(LogGlobalSnapshotEntry entry) {
        if (entry.getValue() == null) {
            return GlobalSnapshotEntryDTO.withoutValue(entry.getName(), entry.getVersion(), entry.getSize());
        }

        return GlobalSnapshotEntryDTO.withValue(entry.getName(), entry.getVersion(), readJson(entry.getValue()));
    }

    /**
     * Reads a value as the log holds it. The logger hides the texts of secrets in every line,
     * which can leave a value that is no longer JSON; such a value is returned as the text it
     * reads, so the response stays valid JSON.
     */
    private static JsonNode readJson(String text) {
        try {
            JsonNode value = JSON.readTree(text);
            // blank text reads as a missing node, which has no JSON to write
            return value == null || value.isMissingNode() ? TextNode.valueOf(text) : value;
        } catch (JsonProcessingException e) {
            return TextNode.valueOf(text);
        }
    }

    /**
     * Convenience for Optional<LogData> → Optional<LogDataDTO>
     */
    public Optional<LogDataDTO> toDto(Optional<LogDataMng> logData) {
        return logData.map(this::toDto);
    }

    /**
     * Convert Map<String,Object> → Map<String,String> via toString().
     */
    private Map<String, String> convertProperties(Map<LogLineKey, Object> props) {
        if (props == null || props.isEmpty()) {
            return Collections.emptyMap();
        }

        return props.entrySet().stream()
                .filter(e -> e.getKey() != null)
                .collect(Collectors.toMap(
                        e -> e.getKey().getSrcName(),           // Convert LogLineKey to String
                        e -> e.getValue() != null ? e.getValue().toString() : "",
                        (v1, v2) -> v2,
                        LinkedHashMap::new
                ));
    }

    /**
     * Build an ErrorInfoDTO from the standard properties keys
     * (adjust the keys if your props use different names).
     */
    private ErrorInfoDTO buildErrorInfo(LogDataError logDataError) {
        if (logDataError == null) {
            return null;
        }
        ErrorInfoDTO err = new ErrorInfoDTO();
        err.setOriginOfErrorPath(logDataError.getErrorOfOriginPath());
        err.setMessage(logDataError.getMessage());
        err.setStackTrace(logDataError.getStackTrace());
        return err;
    }
}
