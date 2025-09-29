package com.becon.opencelium.backend.execution.logmanaging.resource;

import java.util.Map;

public class ErrorInfoDto {
    private String message;
    private String code;
    private Map<String, Object> details;

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public Map<String, Object> getDetails() {
        return details;
    }

    public void setDetails(Map<String, Object> details) {
        this.details = details;
    }
}
