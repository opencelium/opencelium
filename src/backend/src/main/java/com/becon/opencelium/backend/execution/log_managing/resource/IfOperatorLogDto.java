package com.becon.opencelium.backend.execution.log_managing.resource;

import java.util.Map;

public class IfOperatorLogDto {
    private String executionId;
    private String connectorId;
    private String indexPath;
    private String expression;
    private Boolean result;
    private Map<String, Object> refs;
    private ErrorInfoDto error;

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

    public String getExpression() {
        return expression;
    }

    public void setExpression(String expression) {
        this.expression = expression;
    }

    public Boolean getResult() {
        return result;
    }

    public void setResult(Boolean result) {
        this.result = result;
    }

    public Map<String, Object> getRefs() {
        return refs;
    }

    public void setRefs(Map<String, Object> refs) {
        this.refs = refs;
    }

    public ErrorInfoDto getError() {
        return error;
    }

    public void setError(ErrorInfoDto error) {
        this.error = error;
    }
}
