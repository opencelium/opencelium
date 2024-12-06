package com.becon.opencelium.backend.resource.execution;

import jakarta.annotation.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;

@Resource
public class ResponseEx {
    private HttpHeaders header;
    private Object body;
    private int status;

    public ResponseEx() {
    }

    public ResponseEx(HttpHeaders header, Object body, int status) {
        this.header = header;
        this.body = body;
        this.status = status;
    }

    public static ResponseEx of(ResponseEntity<?> entity) {
        return new ResponseEx(entity.getHeaders(), entity.getBody(), entity.getStatusCode().value());
    }

    public HttpHeaders getHeader() {
        return header;
    }

    public void setHeader(HttpHeaders header) {
        this.header = header;
    }

    public Object getBody() {
        return body;
    }

    public void setBody(Object body) {
        this.body = body;
    }

    public int getStatus() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }
}
