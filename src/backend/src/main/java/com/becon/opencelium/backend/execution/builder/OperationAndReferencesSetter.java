package com.becon.opencelium.backend.execution.builder;

import com.becon.opencelium.backend.resource.execution.OperationDTO;
import com.becon.opencelium.backend.resource.execution.SchemaDTO;

import java.util.function.Function;

public class OperationAndReferencesSetter {
    private final OperationDTO operation;
    public OperationAndReferencesSetter(OperationDTO operation) {
        this.operation = operation;
    }

    public RequestEntityBuilder usingReferences(Function<String, SchemaDTO> references) {
        return new RequestEntityBuilder(operation, references);
    }
}
