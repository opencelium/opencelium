package com.becon.opencelium.backend.execution.logger.dto;

public class ErrorInfoDTO {
    private String message;
    private String code;
    private ErrorDetailsDTO details;

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

    public ErrorDetailsDTO getDetails() {
        return details;
    }

    public void setDetails(ErrorDetailsDTO details) {
        this.details = details;
    }
}
