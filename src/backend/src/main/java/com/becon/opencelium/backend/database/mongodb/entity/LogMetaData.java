package com.becon.opencelium.backend.database.mongodb.entity;

import com.becon.opencelium.backend.execution.logger.enums.LogLineType;
import com.becon.opencelium.backend.execution.logger.enums.LogLineValue;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Map;

@Document(collection = "log_meta_data")
@CompoundIndex(name = "exec_connection_flowchart_indexPath_idx",
        def = "{'executionId': 1, 'connectionId': 1, 'flowchartId': 1, 'indexPath': 1}")
public class LogMetaData {
    @Id
    private String id;

    private Long connectionId;
    private String executionId;
    private Integer flowchartId;

    private String indexPath;
    private Long startOffset;
    private Long endOffset;

    private LogLineType logLineType; // PHASE
    private LogLineValue value;       // e.g., LOOP_START, IF_END

    private Map<String, Object> properties;

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

    public Integer getFlowchartId() {
        return flowchartId;
    }

    public void setFlowchartId(Integer flowchartId) {
        this.flowchartId = flowchartId;
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

    public LogLineValue getValue() {
        return value;
    }

    public void setValue(LogLineValue value) {
        this.value = value;
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
