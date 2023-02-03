package com.becon.opencelium.backend.execution.socket;

import java.util.List;

public class SocketLogMessage {
    private String message;
    private String type;
    private List<String> stackTrace;

    public SocketLogMessage() {
    }

    public SocketLogMessage(String message) {
        this.message = message;
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

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
}
