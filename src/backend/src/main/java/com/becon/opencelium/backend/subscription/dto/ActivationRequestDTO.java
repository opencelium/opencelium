package com.becon.opencelium.backend.subscription.dto;

import com.becon.opencelium.backend.enums.ActivReqStatus;
import com.becon.opencelium.backend.utility.crypto.HmacValidator;
import com.fasterxml.jackson.annotation.JsonIgnore;

public class ActivationRequestDTO implements HmacValidator {

    private String id;
    private String machineUuid;
    private String macAddress;
    private String systemUUID;
    private String computerName;
    private long createdAt;
    private String hmac;
    @JsonIgnore
    private long ttl;
    private ActivReqStatus status;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getMachineUuid() {
        return machineUuid;
    }

    public void setMachineUuid(String machineUuid) {
        this.machineUuid = machineUuid;
    }

    public String getMacAddress() {
        return macAddress;
    }

    public void setMacAddress(String macAddress) {
        this.macAddress = macAddress;
    }

    public String getSystemUUID() {
        return systemUUID;
    }

    public void setSystemUUID(String systemUUID) {
        this.systemUUID = systemUUID;
    }

    public String getComputerName() {
        return computerName;
    }

    public void setComputerName(String computerName) {
        this.computerName = computerName;
    }

    public long getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(long createdAt) {
        this.createdAt = createdAt;
    }

    public String getHmac() {
        return hmac;
    }

    public void setHmac(String hmac) {
        this.hmac = hmac;
    }

    public long getTtl() {
        return ttl;
    }

    public void setTtl(long ttl) {
        this.ttl = ttl;
    }

    public ActivReqStatus getStatus() {
        return status;
    }

    public void setStatus(ActivReqStatus status) {
        this.status = status;
    }

    @Override
    public boolean verify(String hmac) {
        return false;
    }

    @Override
    public String toString() {
        return "ActivationRequestDTO{" +
                "id='" + id + '\'' +
                ", machineUuid='" + machineUuid + '\'' +
                ", macAddress='" + macAddress + '\'' +
                ", processorId='" + systemUUID + '\'' +
                ", computerName='" + computerName + '\'' +
                ", createdAt=" + createdAt +
                ", hmac='" + hmac + '\'' +
                ", ttl=" + ttl +
                ", status=" + status +
                '}';
    }
}
