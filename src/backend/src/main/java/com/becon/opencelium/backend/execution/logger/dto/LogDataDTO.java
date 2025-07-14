package com.becon.opencelium.backend.execution.logger.dto;

import com.becon.opencelium.backend.execution.logger.enums.PhaseStatus;
import com.becon.opencelium.backend.execution.logger.enums.PhaseCategory;

import java.util.Map;

public class LogDataDTO {

    private String executionId;
    private String flowId;
    private String indexPath;
    private PhaseStatus status;
    private PhaseCategory type;
    private Map<String, String> properties;
    private ErrorInfoDTO error;

    public String getExecutionId() {
        return executionId;
    }

    public void setExecutionId(String executionId) {
        this.executionId = executionId;
    }

    public String getFlowId() {
        return flowId;
    }

    public void setFlowId(String flowId) {
        this.flowId = flowId;
    }

    public String getIndexPath() {
        return indexPath;
    }

    public void setIndexPath(String indexPath) {
        this.indexPath = indexPath;
    }

    public PhaseStatus getStatus() {
        return status;
    }

    public void setStatus(PhaseStatus status) {
        this.status = status;
    }

    public PhaseCategory getType() {
        return type;
    }

    public void setType(PhaseCategory type) {
        this.type = type;
    }

    public Map<String, String> getProperties() {
        return properties;
    }

    public void setProperties(Map<String, String> properties) {
        this.properties = properties;
    }

    public ErrorInfoDTO getError() {
        return error;
    }

    public void setError(ErrorInfoDTO error) {
        this.error = error;
    }
}
