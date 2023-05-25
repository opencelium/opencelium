package com.becon.opencelium.backend.resource.application;

public class ResultDTO {
    private Object result;

    public ResultDTO() {
    }

    public ResultDTO(Object result) {
        this.result = result;
    }

    public Object getResult() {
        return result;
    }

    public void setResult(Object result) {
        this.result = result;
    }
}
