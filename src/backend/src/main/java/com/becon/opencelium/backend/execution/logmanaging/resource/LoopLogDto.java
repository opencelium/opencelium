package com.becon.opencelium.backend.execution.logmanaging.resource;

import java.util.Map;

public class LoopLogDto {
    private String executionId;
    private String connectorId;
    private String indexPath;
    private String parent;
    private String expression;
    private String iterator;
    private Integer size;
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

    public String getParent() {
        return parent;
    }

    public void setParent(String parent) {
        this.parent = parent;
    }

    public String getExpression() {
        return expression;
    }

    public void setExpression(String expression) {
        this.expression = expression;
    }

    public String getIterator() {
        return iterator;
    }

    public void setIterator(String iterator) {
        this.iterator = iterator;
    }

    public Integer getSize() {
        return size;
    }

    public void setSize(Integer size) {
        this.size = size;
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
