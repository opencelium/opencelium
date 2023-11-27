package com.becon.opencelium.backend.execution.oc721;

import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;

import java.util.Map;

public class Operation {
    private String id;
    private String color;
    private Integer aggregatorId;
    private Map<String, RequestEntity<?>> requests;
    private Map<String, ResponseEntity<?>> responses;
}
