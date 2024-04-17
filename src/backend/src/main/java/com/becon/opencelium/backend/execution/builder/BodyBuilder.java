package com.becon.opencelium.backend.execution.builder;

import com.becon.opencelium.backend.resource.execution.OperationDTO;

import java.util.function.Function;

public interface BodyBuilder {
    Object build(OperationDTO operation, Function<String, Object> references);
}
