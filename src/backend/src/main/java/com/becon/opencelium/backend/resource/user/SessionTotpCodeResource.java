package com.becon.opencelium.backend.resource.user;

import jakarta.annotation.Resource;

@Resource
public class SessionTotpCodeResource {
    private String sessionId;
    private String code;

    public SessionTotpCodeResource() {
    }

    public SessionTotpCodeResource(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}
