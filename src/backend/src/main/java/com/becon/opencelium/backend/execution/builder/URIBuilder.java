package com.becon.opencelium.backend.execution.builder;

import com.becon.opencelium.backend.resource.execution.OperationDTO;
import com.becon.opencelium.backend.resource.execution.SchemaDTO;

import java.net.URI;
import java.util.function.Function;

public interface URIBuilder {
    URI build(OperationDTO operation, Function<String, SchemaDTO> references);
}
