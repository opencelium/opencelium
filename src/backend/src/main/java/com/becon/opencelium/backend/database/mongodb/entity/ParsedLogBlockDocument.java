package com.becon.opencelium.backend.database.mongodb.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Map;

@Document(collection = "parsed_log_blocks")
@CompoundIndex(name = "exec_connection_flowchart_indexPath_idx",
        def = "{'executionId': 1, 'connectionId': 1, 'flowchartId': 1, 'indexPath': 1}")
public class ParsedLogBlockDocument {
    @Id
    private String id;

    private Long connectionId;
    private String executionId;
    private Integer flowchartId;

    private String indexPath;
    private Long startOffset;
    private Long endOffset;

    private String logLineType; // PHASE
    private String value;       // e.g., LOOP_START, IF_END

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

    public String getLogLineType() {
        return logLineType;
    }

    public void setLogLineType(String logLineType) {
        this.logLineType = logLineType;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
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
