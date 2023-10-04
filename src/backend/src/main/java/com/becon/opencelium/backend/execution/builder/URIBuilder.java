package com.becon.opencelium.backend.execution.builder;

import com.becon.opencelium.backend.resource.execution.OperationDTO;

import java.net.URI;

public interface URIBuilder {
    URI build(OperationDTO operation, ResponseContainer container);
}
