package com.becon.opencelium.backend.database.mysql.entity;

import com.becon.opencelium.backend.enums.ActivReqStatus;
import com.becon.opencelium.backend.license.HMACValidator;
import com.becon.opencelium.backend.utility.crypto.HMACUtility;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "activation_request")
public class ActivationRequest implements HMACValidator {
    @Id
    private UUID id;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    private String hmac;

    private int ttl;

    @Enumerated(EnumType.STRING)
    private ActivReqStatus status;

    private transient String machineUUID;

    private transient String macAddress;

    private transient String processorId;

    private transient String computerName;

    @Override
    public boolean verify(String other) {
        if (this.id == null) {
            return false;
        }
        if (this.hmac == null) {
            String hmac = generateHmac();
            return Objects.equals(hmac, other);
        } else {
            return Objects.equals(this.hmac, other);
        }
    }

    public void generateAndSetHmac() {
        this.hmac = generateHmac();
    }

    public String generateHmac() {
        if (this.id == null) {
            return null;
        }
        return HMACUtility.encode(
                this.id
                        + (this.machineUUID == null ? "" : this.machineUUID)
                        + (this.macAddress == null ? "" : this.macAddress)
                        + (this.processorId == null ? "" : this.processorId)
                        + (this.computerName == null ? "" : this.computerName)
        );
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getHmac() {
        return hmac;
    }

    public void setHmac(String hmac) {
        this.hmac = hmac;
    }

    public int getTtl() {
        return ttl;
    }

    public void setTtl(int ttl) {
        this.ttl = ttl;
    }

    public ActivReqStatus getStatus() {
        return status;
    }

    public void setStatus(ActivReqStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getComputerName() {
        return computerName;
    }

    public void setComputerName(String computerName) {
        this.computerName = computerName;
    }

    public String getProcessorId() {
        return processorId;
    }

    public void setProcessorId(String processorId) {
        this.processorId = processorId;
    }

    public String getMacAddress() {
        return macAddress;
    }

    public void setMacAddress(String macAddress) {
        this.macAddress = macAddress;
    }

    public String getMachineUUID() {
        return machineUUID;
    }

    public void setMachineUUID(String machineUUID) {
        this.machineUUID = machineUUID;
    }
}
