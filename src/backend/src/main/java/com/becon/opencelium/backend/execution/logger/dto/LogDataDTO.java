package com.becon.opencelium.backend.execution.logger.dto;

import com.becon.opencelium.backend.execution.logger.enums.PhaseStatus;
import com.becon.opencelium.backend.execution.logger.enums.PhaseCategory;
import io.netty.handler.codec.serialization.ObjectEncoder;

import java.util.Map;

public class LogDataDTO {

    private String executionId;
    private String flowId;
    private String indexPath;
    private PhaseStatus status;
    private PhaseCategory type;
    private String connectorName;
    private Map<String, Object> properties;
    private Map<String, Object> segment;
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

    public String getConnectorName() {
        return connectorName;
    }

    public void setConnectorName(String connectorName) {
        this.connectorName = connectorName;
    }

    public Map<String, Object> getProperties() {
        return properties;
    }

    public void setProperties(Map<String, Object> properties) {
        this.properties = properties;
    }

    public Map<String, Object> getSegment() {
        return segment;
    }

    public void setSegment(Map<String, Object> segment) {
        this.segment = segment;
    }

    public ErrorInfoDTO getError() {
        return error;
    }

    public void setError(ErrorInfoDTO error) {
        this.error = error;
    }
}
