package com.becon.opencelium.backend.execution.logmanaging.resource;

import com.becon.opencelium.backend.execution.logmanaging.commons.ExecutionStatus;
import com.becon.opencelium.backend.execution.logmanaging.commons.LogElementType;

import java.util.Map;

public class MetaDataListDto {
    private String name;
    private LogElementType type;
    private String executionId;
    private String connectorId;
    private String indexPath;
    private ExecutionStatus status;
    private Map<String, Object> meta;
    private ErrorInfoDto error;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public LogElementType getType() {
        return type;
    }

    public void setType(LogElementType type) {
        this.type = type;
    }

    public String getExecutionId() {
        return executionId;
    }

    public void setExecutionId(String executionId) {
        this.executionId = executionId;
    }

    public String getConnectorId() {
        return connectorId;
    }

    public void setConnectorId(String connectorId) {
        this.connectorId = connectorId;
    }

    public String getIndexPath() {
        return indexPath;
    }

    public void setIndexPath(String indexPath) {
        this.indexPath = indexPath;
    }

    public ExecutionStatus getStatus() {
        return status;
    }

    public void setStatus(ExecutionStatus status) {
        this.status = status;
    }

    public Map<String, Object> getMeta() {
        return meta;
    }

    public void setMeta(Map<String, Object> meta) {
        this.meta = meta;
    }

    public ErrorInfoDto getError() {
        return error;
    }

    public void setError(ErrorInfoDto error) {
        this.error = error;
    }
}
