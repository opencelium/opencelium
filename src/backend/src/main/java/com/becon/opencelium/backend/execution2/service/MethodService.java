package com.becon.opencelium.backend.execution2.service;

import com.becon.opencelium.backend.invoker.entity.Body;
import com.becon.opencelium.backend.neo4j.entity.BodyNode;
import com.becon.opencelium.backend.neo4j.entity.HeaderNode;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;

public interface MethodService {

    String getUri();
    HttpHeaders getHeader();
    HttpMethod getHttpMethod();
    String getMessage();
}
