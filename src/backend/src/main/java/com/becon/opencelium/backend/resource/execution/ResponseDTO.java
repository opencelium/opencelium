package com.becon.opencelium.backend.resource.execution;

import org.springframework.http.MediaType;

import java.util.Map;

public class ResponseDTO {
    private MediaType content;
    private String status; //success or fail
    private String code;
    private String format;
    private String data;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getFormat() {
        return format;
    }

    public void setFormat(String format) {
        this.format = format;
    }

    public String getData() {
        return data;
    }

    public void setData(String data) {
        this.data = data;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public MediaType getContent() {
        return content;
    }

    public void setContent(MediaType content) {
        this.content = content;
    }
}
