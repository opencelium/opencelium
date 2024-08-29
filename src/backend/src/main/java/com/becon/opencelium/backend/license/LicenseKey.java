package com.becon.opencelium.backend.license;

import java.math.BigInteger;
import java.sql.Timestamp;

public class LicenseKey {
    private Timestamp expirationDate;
    private String companyId;
    private BigInteger operationUsage;
    private String subId;
    private String hmac;

    public Timestamp getExpirationDate() {
        return expirationDate;
    }

    public void setExpirationDate(Timestamp expirationDate) {
        this.expirationDate = expirationDate;
    }

    public String getCompanyId() {
        return companyId;
    }

    public void setCompanyId(String companyId) {
        this.companyId = companyId;
    }

    public BigInteger getOperationUsage() {
        return operationUsage;
    }

    public void setOperationUsage(BigInteger operationUsage) {
        this.operationUsage = operationUsage;
    }

    public String getSubId() {
        return subId;
    }

    public void setSubId(String subId) {
        this.subId = subId;
    }

    public String getHmac() {
        return hmac;
    }

    public void setHmac(String hmac) {
        this.hmac = hmac;
    }
}
