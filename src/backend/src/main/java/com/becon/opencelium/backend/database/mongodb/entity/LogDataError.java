package com.becon.opencelium.backend.database.mongodb.entity;

import java.util.List;

public class LogDataError {
    private String message;
    private List<String> stackTrace;

    public LogDataError() {
    }

    public LogDataError(String message, List<String> stackTrace) {
        this.message = message;
        this.stackTrace = stackTrace;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public List<String> getStackTrace() {
        return stackTrace;
    }

    public void setStackTrace(List<String> stackTrace) {
        this.stackTrace = stackTrace;
    }
}
