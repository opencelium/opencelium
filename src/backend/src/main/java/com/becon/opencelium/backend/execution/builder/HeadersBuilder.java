package com.becon.opencelium.backend.execution.builder;

import com.becon.opencelium.backend.resource.execution.OperationDTO;
import org.springframework.http.HttpHeaders;

import java.util.function.Function;

public interface HeadersBuilder {
    HttpHeaders build(OperationDTO operation, Function<String, Object> references);
}
