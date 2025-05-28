package com.becon.opencelium.backend.execution.log_managing.resource;

import com.becon.opencelium.backend.execution.log_managing.commons.ExecutionStatus;

import java.util.Map;

public class MethodLogDto {
    private String name;
    private String executionId;
    private String connectorId;
    private String indexPath;
    private ExecutionStatus status;
    private Map<String, Object> request;
    private Map<String, Object> response;
    private ErrorInfoDto error;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
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

    public Map<String, Object> getRequest() {
        return request;
    }

    public void setRequest(Map<String, Object> request) {
        this.request = request;
    }

    public Map<String, Object> getResponse() {
        return response;
    }

    public void setResponse(Map<String, Object> response) {
        this.response = response;
    }

    public ErrorInfoDto getError() {
        return error;
    }

    public void setError(ErrorInfoDto error) {
        this.error = error;
    }
}
