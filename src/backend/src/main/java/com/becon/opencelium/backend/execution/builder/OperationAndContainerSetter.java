package com.becon.opencelium.backend.execution.builder;

import com.becon.opencelium.backend.resource.execution.OperationDTO;

public class OperationAndContainerSetter {
    private final OperationDTO operation;
    public OperationAndContainerSetter(OperationDTO operation) {
        this.operation = operation;
    }

    public RequestBuilder usingContainer(ResponseContainer container) {
        return new RequestBuilder(operation, container);
    }
}
