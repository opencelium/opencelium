package com.becon.opencelium.backend.execution;

import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;

import java.util.Map;

public class JSHttpObject {
    private int status;
    private Map<String, String> header;
    private String body;

    public JSHttpObject() {
    }

    public JSHttpObject(RequestEntity<?> responseEntity) {
        this.header = responseEntity.getHeaders().toSingleValueMap();
        if (responseEntity.getBody() != null) {
            this.body = responseEntity.getBody().toString();
        }
    }

    public JSHttpObject(ResponseEntity<?> responseEntity) {
        this.status = responseEntity.getStatusCode().value();
        this.header = responseEntity.getHeaders().toSingleValueMap();
        if (responseEntity.getBody() != null) {
            this.body = responseEntity.getBody().toString();
        }
    }

    public int getStatus() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }

    public Map<String, String> getHeader() {
        return header;
    }

    public void setHeader(Map<String, String> header) {
        this.header = header;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }
}
