package com.becon.opencelium.backend.execution.builder;

import com.becon.opencelium.backend.resource.execution.OperationDTO;
import org.springframework.http.RequestEntity;

public interface RequestEntityBuilder {
    RequestEntity<?> build(OperationDTO operation, ResponseContainer container);
}
