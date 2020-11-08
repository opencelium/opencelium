package com.becon.opencelium.backend.execution2.container;

import org.springframework.http.ResponseEntity;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Method {

    private String methodKey;
    private String exchangeType;
    private String result;

    private List<String> loops = new ArrayList<>(); // how many loop are used to make request of this method
    private Map<List<Integer>, ResponseEntity<String>> responses = new HashMap<>();// <indexes of loops, response data>

    public Method(String methodKey, String exchangeType, String result) {
        this.methodKey = methodKey;
        this.exchangeType = exchangeType;
        this.result = result;
    }

    public String getMethodKey() {
        return methodKey;
    }

    public String getExchangeType() {
        return exchangeType;
    }

    public String getResult() {
        return result;
    }

    public void setLoop(String loop) {
        loops.add(loop);
    }

    public void setAllLoops(List<String> loops) {
        this.loops = loops;
    }

    public boolean hasLoop() {
        return !loops.isEmpty();
    }

    public Integer getLoopLevel() {
        return loops.size();
    }

    public void saveResponse(List<Integer> currentLoopIndex, ResponseEntity<String> data) {
        responses.put(currentLoopIndex, data);
    }

    public void saveAllResponses(Map<List<Integer>, ResponseEntity<String>> responses) {
        this.responses = responses;
    }

    public ResponseEntity<String> getResponse(List<Integer> indexes) {
        return responses.get(indexes);
    }

    public boolean hasResponseData(){
        return !responses.isEmpty();
    }
}
