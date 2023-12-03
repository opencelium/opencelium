package com.becon.opencelium.backend.execution.oc721;

import com.becon.opencelium.backend.resource.execution.OperationDTO;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;

import java.util.HashMap;
import java.util.Map;

public class Operation {
    private String id;
    private String color;
    private Integer aggregatorId;
    private final Map<String, RequestEntity<?>> requests = new HashMap<>();
    private final Map<String, ResponseEntity<?>> responses = new HashMap<>();

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public Integer getAggregatorId() {
        return aggregatorId;
    }

    public void setAggregatorId(Integer aggregatorId) {
        this.aggregatorId = aggregatorId;
    }

    public void putRequest(String key, RequestEntity<?> requestEntity) {
        requests.put(key, requestEntity);
    }

    public void putResponse(String key, ResponseEntity<?> responseEntity) {
        responses.put(key, responseEntity);
    }

    public Map<String, RequestEntity<?>> getRequests() {
        return requests;
    }

    public Map<String, ResponseEntity<?>> getResponses() {
        return responses;
    }

    public static Operation fromDTO(OperationDTO operationDTO) {
        Operation operation = new Operation();

        // TODO: correct mapping
        operation.setId(operationDTO.getName());
        operation.setColor(operationDTO.getOperationId());

        return operation;
    }
}
