package com.becon.opencelium.backend.execution.builder;

import com.becon.opencelium.backend.resource.execution.OperationDTO;
import org.springframework.http.HttpHeaders;

public interface HeadersBuilder {
    HttpHeaders buildHeaders(OperationDTO operation, ResponseContainer container);
}
