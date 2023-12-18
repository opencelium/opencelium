package com.becon.opencelium.backend.resource.execution;

import java.util.List;
import java.util.Map;

public class ConnectorEx {
    private List<OperationDTO> methods;
    private List<OperatorEx> operators;
    private Map<String, String> requiredData;

    public ConnectorEx() {
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
}
