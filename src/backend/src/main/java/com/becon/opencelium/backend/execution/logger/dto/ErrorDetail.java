package com.becon.opencelium.backend.execution.logger.dto;

import com.becon.opencelium.backend.execution.logger.context.SegmentContext;

import java.util.List;

public class ErrorDetail {
    private String errorOriginPath;
    private List<String> stackTrace;
    private SegmentContext exception;

    public ErrorDetail(String errorOriginPath, SegmentContext exception) {
        this.errorOriginPath = errorOriginPath;
        this.exception = exception;
    }

    public String getErrorOriginPath() {
        return errorOriginPath;
    }

    public void setErrorOriginPath(String errorOriginPath) {
        this.errorOriginPath = errorOriginPath;
    }

    public List<String> getStackTrace() {
        return stackTrace;
    }

    public void setStackTrace(List<String> stackTrace) {
        this.stackTrace = stackTrace;
    }

    public SegmentContext getException() {
        return exception;
    }

    public void setException(SegmentContext exception) {
        this.exception = exception;
    }
}
