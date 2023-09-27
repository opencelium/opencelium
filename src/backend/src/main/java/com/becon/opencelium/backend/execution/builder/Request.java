package com.becon.opencelium.backend.execution.builder;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.RequestEntity;

public class Request {
    private String url;
    private HttpMethod httpMethod;
    private HttpHeaders httpHeaders;
    private RequestEntity<?> requestEntity;

    public Request(String url, HttpMethod httpMethod, HttpHeaders httpHeaders, RequestEntity<?> requestEntity) {
        this.url = url;
        this.httpMethod = httpMethod;
        this.httpHeaders = httpHeaders;
        this.requestEntity = requestEntity;
    }

    public String getUrl() {
        return url;
    }

    public HttpMethod getHttpMethod() {
        return httpMethod;
    }

    public HttpHeaders getHttpHeaders() {
        return httpHeaders;
    }

    public RequestEntity<?> getRequestEntity() {
        return requestEntity;
    }
}
