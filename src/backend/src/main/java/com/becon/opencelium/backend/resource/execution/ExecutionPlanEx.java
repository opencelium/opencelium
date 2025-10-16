package com.becon.opencelium.backend.resource.execution;

import java.util.List;

public class ExecutionPlanEx {
    private String mode;

    private List<String> steps;

    private OnErrorEx onError;

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

    public OnErrorEx getOnError() {
        return onError;
    }

    public void setOnError(OnErrorEx onError) {
        this.onError = onError;
    }
}
