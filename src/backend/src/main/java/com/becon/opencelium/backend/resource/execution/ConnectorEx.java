package com.becon.opencelium.backend.resource.execution;

import java.util.List;

public class ConnectorEx {
    private List<OperationDTO> methods;
    private List<OperatorEx> operators;

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
}
