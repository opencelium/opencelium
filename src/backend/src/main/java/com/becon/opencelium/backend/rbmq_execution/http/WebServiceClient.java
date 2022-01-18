package com.becon.opencelium.backend.rbmq_execution.http;

import org.springframework.http.ResponseEntity;

public interface WebServiceClient<T> {
    ResponseEntity<T> send(OcRequest request, Class<T> responseType);
}
