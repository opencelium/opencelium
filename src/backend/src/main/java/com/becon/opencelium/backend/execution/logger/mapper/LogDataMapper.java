package com.becon.opencelium.backend.execution.logger.mapper;

import com.becon.opencelium.backend.database.mongodb.entity.LogData;
import com.becon.opencelium.backend.execution.logger.dto.ErrorInfoDTO;
import com.becon.opencelium.backend.execution.logger.dto.LogDataDTO;
import com.becon.opencelium.backend.execution.logger.enums.PhaseStatus;
import com.becon.opencelium.backend.execution.logger.keys.LogLineKey;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class LogDataMapper {
    /**
     * Map a LogData entity to its DTO.
     */
    public LogDataDTO toDto(LogData src) {
        LogDataDTO dto = new LogDataDTO();
        dto.setExecutionId(src.getExecutionId());
        dto.setFlowId(src.getFlowchartId());
        dto.setIndexPath(src.getIndexPath());
        dto.setStatus(src.getStatus());
        dto.setType(src.getType());
        dto.setProperties(convertProperties(src.getProperties()));

        if (src.getStatus() == PhaseStatus.FAIL) {
            dto.setError(buildErrorInfo(src.getProperties()));
        }
        return dto;
    }

    /**
     * Convenience for Optional<LogData> → Optional<LogDataDTO>
     */
    public Optional<LogDataDTO> toDto(Optional<LogData> logData) {
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
                        e -> e.getKey().name(),           // Convert LogLineKey to String
                        e -> e.getValue() != null ? e.getValue().toString() : "",
                        (v1, v2) -> v2.toLowerCase(Locale.ROOT),
                        LinkedHashMap::new
                ));
    }

    /**
     * Build an ErrorInfoDTO from the standard properties keys
     * (adjust the keys if your props use different names).
     */
    private ErrorInfoDTO buildErrorInfo(Map<LogLineKey, Object> props) {
        ErrorInfoDTO err = new ErrorInfoDTO();
//        Object code = props.get("errorCode");
        Object message = props.get(LogLineKey.EXCEPTION);
//        err.setCode(code != null ? code.toString() : null);
        err.setMessage(message != null ? message.toString() : null);
        return err;
    }
}
