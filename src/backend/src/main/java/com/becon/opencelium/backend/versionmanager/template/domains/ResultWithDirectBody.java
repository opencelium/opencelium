package com.becon.opencelium.backend.versionmanager.template.domains;

import java.util.Map;

public class ResultWithDirectBody {

    private String status;
    private Map<String, String> header;
    private Map<String, Object> body;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Map<String, String> getHeader() {
        return header;
    }

    public void setHeader(Map<String, String> header) {
        this.header = header;
    }

    public Map<String, Object> getBody() {
        return body;
    }

    public void setBody(Map<String, Object> body) {
        this.body = body;
    }
}
