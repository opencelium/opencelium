package com.becon.opencelium.backend.execution.logger.dto;

import java.util.List;

public class ErrorInfoDTO {
    private String message;
    private String code;
    private String originOfErrorPath;
    private List<String> stackTrace;

    public ErrorInfoDTO() {
    }

    public ErrorInfoDTO(String message, List<String> stackTrace) {
        this.message = message;
        this.stackTrace = stackTrace;
    }

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

    public String getOriginOfErrorPath() {
        return originOfErrorPath;
    }

    public void setOriginOfErrorPath(String originOfErrorPath) {
        this.originOfErrorPath = originOfErrorPath;
    }

    public List<String> getStackTrace() {
        return stackTrace;
    }

    public void setStackTrace(List<String> stack_trace) {
        this.stackTrace = stack_trace;
    }
}
