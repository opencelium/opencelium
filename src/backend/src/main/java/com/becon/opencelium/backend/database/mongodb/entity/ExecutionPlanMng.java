package com.becon.opencelium.backend.database.mongodb.entity;

import org.springframework.data.mongodb.core.mapping.Field;

import java.util.List;

public class ExecutionPlanMng {

    @Field(name = "mode")
    private String mode;

    @Field(name = "steps")
    private List<String> steps;

    @Field(name = "on_error")
    private OnErrorMng onError;

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

    public OnErrorMng getOnError() {
        return onError;
    }

    public void setOnError(OnErrorMng onError) {
        this.onError = onError;
    }
}
