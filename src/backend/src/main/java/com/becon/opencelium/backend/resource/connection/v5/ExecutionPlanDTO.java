package com.becon.opencelium.backend.resource.connection.v5;

import java.util.List;

public class ExecutionPlanDTO {

    private String mode;

    private List<String> steps;

    private OnErrorDTO onError;

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    public List<String> getSteps() {
        return steps;
    }

    public void setSteps(List<String> steps) {
        this.steps = steps;
    }

    public OnErrorDTO getOnError() {
        return onError;
    }

    public void setOnError(OnErrorDTO onError) {
        this.onError = onError;
    }
}
