package com.becon.opencelium.backend.resource.execution;

import java.util.List;
import java.util.Map;

public class ConnectorEx {
    private int id;
    private String name;
    private boolean sslCert;
    private boolean action;
    private String invoker;
    private List<OperationDTO> methods;
    private List<OperatorEx> operators;
    private Map<String, String> requiredData;

    public ConnectorEx() {
    }

    public String getName() {
        return name;
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

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public boolean isSslCert() {
        return sslCert;
    }

    public void setSslCert(boolean sslCert) {
        this.sslCert = sslCert;
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
}
