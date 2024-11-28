package com.becon.opencelium.backend.resource.user;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.annotation.Resource;

@Resource
public class TotpResource {
    private String sessionId;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String secretKey;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String qr;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String code;

    public TotpResource() {
    }

    public TotpResource(String sessionId) {
        this.sessionId = sessionId;
    }

    public TotpResource(String sessionId, String secretKey, String qr) {
        this.sessionId = sessionId;
        this.secretKey = secretKey;
        this.qr = qr;
    }

    public String getSecretKey() {
        return secretKey;
    }

    public void setSecretKey(String secretKey) {
        this.secretKey = secretKey;
    }

    public String getQr() {
        return qr;
    }

    public void setQr(String qr) {
        this.qr = qr;
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
