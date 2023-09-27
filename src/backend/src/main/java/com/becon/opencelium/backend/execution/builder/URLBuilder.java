package com.becon.opencelium.backend.execution.builder;

import com.becon.opencelium.backend.resource.execution.OperationDTO;

public interface URLBuilder {
    String buildURL(OperationDTO operation, ResponseContainer container);
}
