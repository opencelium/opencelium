package com.becon.opencelium.backend.database.mysql.entity;

import com.becon.opencelium.backend.enums.ActivReqStatus;
import com.becon.opencelium.backend.subscription.remoteapi.RemoteApi;
import com.becon.opencelium.backend.subscription.remoteapi.ServicePortal;
import com.becon.opencelium.backend.subscription.remoteapi.enums.ApiModule;
import com.becon.opencelium.backend.subscription.remoteapi.module.SubscriptionModule;
import com.becon.opencelium.backend.utility.crypto.HmacUtility;
import com.becon.opencelium.backend.utility.crypto.HmacValidator;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "activation_request", indexes = {@Index(name = "idx_hmac", columnList = "hmac")})
public class ActivationRequest implements HmacValidator {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "hmac", length = 255, nullable = false)
    private String hmac;

    @Column(name = "ttl", nullable = false)
    private int ttl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", columnDefinition = "ENUM('PENDING', 'PROCESSED', 'EXPIRED')", nullable = false)
    private ActivReqStatus status = ActivReqStatus.PENDING;

    @Transient
    private String machineUUID;

    @Transient
    private String macAddress;

    @Transient
    private String processorId;

    @Transient
    private String computerName;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
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

    public String getMachineUUID() {
        return machineUUID;
    }

    public void setMachineUUID(String machineUUID) {
        this.machineUUID = machineUUID;
    }

    public String getMacAddress() {
        return macAddress;
    }

    public void setMacAddress(String macAddress) {
        this.macAddress = macAddress;
    }

    public String getProcessorId() {
        return processorId;
    }

    public void setProcessorId(String processorId) {
        this.processorId = processorId;
    }

    public String getComputerName() {
        return computerName;
    }

    public void setComputerName(String computerName) {
        this.computerName = computerName;
    }

    @Override
    public boolean verify(String anotherHmac) {
        if (this.id == null) {
            return false;
        }
        if (this.hmac == null) {
            String hmac = HmacUtility.generateHmac(this.id.toString(), ActivationRequest.class);
            return Objects.equals(hmac, anotherHmac);
        } else {
            return Objects.equals(this.hmac, anotherHmac);
        }
    }
}
