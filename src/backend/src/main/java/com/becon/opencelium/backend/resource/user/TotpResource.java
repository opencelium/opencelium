package com.becon.opencelium.backend.resource.user;

import jakarta.annotation.Resource;

@Resource
public class TotpResource {
    private String secretKey;
    private String qr;

    public TotpResource() {
    }

    public TotpResource(String secretKey, String qr) {
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
}
