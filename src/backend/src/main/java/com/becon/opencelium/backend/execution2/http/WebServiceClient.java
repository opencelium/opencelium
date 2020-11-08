package com.becon.opencelium.backend.execution2.http;

import com.becon.opencelium.backend.neo4j.entity.MethodNode;
import org.springframework.http.HttpRequest;
import org.springframework.http.ResponseEntity;

public interface WebServiceClient<T> {
    ResponseEntity<T> send(OcRequest request, Class<T> responseType);
}
