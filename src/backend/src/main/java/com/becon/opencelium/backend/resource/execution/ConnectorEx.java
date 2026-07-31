package com.becon.opencelium.backend.resource.execution;

import com.becon.opencelium.backend.invoker.entity.Pagination;

import java.util.List;
import java.util.Map;

/**
 * Execution representation of a connector for legacy (two-connector) connections.
 * <p>
 * Populated via {@link ConnectionEx#getSource()} and {@link ConnectionEx#getTarget()}.
 * <p>
 * <b>Not used in multi-connector connections.</b> In that mode {@link ConnectionEx#getSource()}
 * and {@link ConnectionEx#getTarget()} are {@code null} — connector metadata is carried per-method
 * in {@link ConnectionEx#getConnectors()} as {@link MethodConnectorEx} instances.
 * Always null-check before accessing either field on {@link ConnectionEx}.
 */
public class ConnectorEx implements ExecutionConnector {
    private Integer id;
    private String fchartId;
    private String name;
    private boolean sslCert;
    private int timeout;
    private boolean action;
    private String invoker;
    private Pagination pagination;
    private List<OperationDTO> methods;
    private List<OperatorEx> operators;
    private Map<String, String> requiredData;

    public ConnectorEx() {
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<OperationDTO> getMethods() {
        return methods;
    }

    public void setMethods(List<OperationDTO> methods) {
        this.methods = methods;
    }

    public List<OperatorEx> getOperators() {
        return operators;
    }

    public void setOperators(List<OperatorEx> operators) {
        this.operators = operators;
    }

    public Map<String, String> getRequiredData() {
        return requiredData;
    }

    public void setRequiredData(Map<String, String> requiredData) {
        this.requiredData = requiredData;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public boolean isSslCert() {
        return sslCert;
    }

    public void setSslCert(boolean sslCert) {
        this.sslCert = sslCert;
    }

    public int getTimeout() {
        return timeout;
    }

    public void setTimeout(int timeout) {
        this.timeout = timeout;
    }

    public boolean isAction() {
        return action;
    }

    public void setAction(boolean action) {
        this.action = action;
    }

    public String getInvoker() {
        return invoker;
    }

    public void setInvoker(String invoker) {
        this.invoker = invoker;
    }

    public Pagination getPagination() {
        return pagination;
    }

    public void setPagination(Pagination pagination) {
        this.pagination = pagination;
    }

    public String getFchartId() {
        return fchartId;
    }

    public void setFchartId(String fchartId) {
        this.fchartId = fchartId;
    }
}
