package com.becon.opencelium.backend.execution.action;

import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;

import java.util.Map;

public class Operation implements Action {
    private String id;
    private String color;
    private Integer aggregatorId;
    private RequestEntity<?> request;
    private Map<String, ResponseEntity<?>> responses;

    @Override
    public Object execute(String ref) {
        return null;
    }
}
