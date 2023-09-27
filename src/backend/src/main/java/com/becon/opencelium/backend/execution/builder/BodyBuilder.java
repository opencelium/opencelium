package com.becon.opencelium.backend.execution.builder;

import com.becon.opencelium.backend.resource.execution.OperationDTO;
import org.springframework.http.RequestEntity;

public interface BodyBuilder {
    RequestEntity<?> buildBody(OperationDTO operation, ResponseContainer container);
}
