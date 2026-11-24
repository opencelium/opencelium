package com.becon.opencelium.backend.execution.logger.dto;

import com.becon.opencelium.backend.execution.logger.enums.PhaseStatus;
import com.becon.opencelium.backend.execution.logger.enums.PhaseCategory;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;
import java.util.Map;

public class LogDataDTO {
    private String id;
    private String executionId;
    private String flowId;
    private String indexPath;
    private PhaseStatus status;
    private PhaseCategory type;
    private String connectorName;
    private Map<String, Object> properties;
    private Map<String, Object> segment;
    private ErrorInfoDTO error;

    // EXECUTION only: left out for every other element, while the run is going and for a run
    // logged before the snapshot was part of the log; empty when the run read no global variable
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @ArraySchema(arraySchema = @Schema(description = "Global variables the run read, EXECUTION element only"))
    private List<GlobalSnapshotEntryDTO> globalSnapshot;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

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

    public List<GlobalSnapshotEntryDTO> getGlobalSnapshot() {
        return globalSnapshot;
    }

    public void setGlobalSnapshot(List<GlobalSnapshotEntryDTO> globalSnapshot) {
        this.globalSnapshot = globalSnapshot;
    }
}
