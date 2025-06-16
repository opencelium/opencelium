package com.becon.opencelium.backend.database.mongodb.entity;

import com.becon.opencelium.backend.execution.logger.enums.PhaseCategory;
import com.becon.opencelium.backend.execution.logger.enums.LogMetaDataStatus;
import com.becon.opencelium.backend.execution.logger.enums.LogLineType;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Document(collection = "log_data")
@CompoundIndex(name = "exec_connection_flowchart_indexPath_idx",
        def = "{'executionId': 1, 'connectionId': 1, 'flowchartId': 1, 'indexPath': 1}")
public class LogData {
    @Id
    private String id;

    private Long connectionId;
    private String executionId;
    private String flowchartId;

    private LogMetaDataStatus status;
    private String indexPath;
    private Long startOffset;
    private Long endOffset;

    private LogLineType logLineType; // PHASE
    private PhaseCategory type;       // e.g., LOOP, IF

    private Map<String, Object> properties = new HashMap<>();

    private Instant createdAt;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Long getConnectionId() {
        return connectionId;
    }

    public void setConnectionId(Long connectionId) {
        this.connectionId = connectionId;
    }

    public String getExecutionId() {
        return executionId;
    }

    public void setExecutionId(String executionId) {
        this.executionId = executionId;
    }

    public String getFlowchartId() {
        return flowchartId;
    }

    public void setFlowchartId(String flowchartId) {
        this.flowchartId = flowchartId;
    }

    public LogMetaDataStatus getStatus() {
        return status;
    }

    public void setStatus(LogMetaDataStatus status) {
        this.status = status;
    }

    public void setStartOffset(Long startOffset) {
        this.startOffset = startOffset;
    }

    public String getIndexPath() {
        return indexPath;
    }

    public void setIndexPath(String indexPath) {
        this.indexPath = indexPath;
    }

    public long getStartOffset() {
        return startOffset;
    }

    public void setStartOffset(long startOffset) {
        this.startOffset = startOffset;
    }

    public Long getEndOffset() {
        return endOffset;
    }

    public void setEndOffset(Long endOffset) {
        this.endOffset = endOffset;
    }

    public LogLineType getLogLineType() {
        return logLineType;
    }

    public void setLogLineType(LogLineType logLineType) {
        this.logLineType = logLineType;
    }

    public PhaseCategory getType() {
        return type;
    }

    public void setType(PhaseCategory type) {
        this.type = type;
    }

    public Map<String, Object> getProperties() {
        return properties;
    }

    public void setProperties(Map<String, Object> properties) {
        this.properties = properties;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
