package com.becon.opencelium.backend.execution.logger.mapper;

import com.becon.opencelium.backend.database.mongodb.entity.LogDataMng;
import com.becon.opencelium.backend.database.mongodb.entity.LogDataError;
import com.becon.opencelium.backend.execution.logger.dto.ErrorInfoDTO;
import com.becon.opencelium.backend.execution.logger.dto.LogDataDTO;
import com.becon.opencelium.backend.execution.logger.keys.LogLineKey;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class LogDataMapper {
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
        // Handle exception segment separately
        return dto;
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
