package com.becon.opencelium.backend.execution.builder;

import com.becon.opencelium.backend.resource.execution.OperationDTO;

public class OperationCarrier {
    public OperationCarrier() {
    }

    public OperationAndContainerSetter forOperation(OperationDTO operation) {
        return new OperationAndContainerSetter(operation);
    }
}
