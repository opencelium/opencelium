package com.becon.opencelium.backend.rbmq_execution.service;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;

public interface MethodService {

    String getUri();
    HttpHeaders getHeader();
    HttpMethod getHttpMethod();
    String getMessage();
}
