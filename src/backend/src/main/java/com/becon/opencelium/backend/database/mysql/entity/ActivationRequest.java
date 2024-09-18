package com.becon.opencelium.backend.database.mysql.entity;

import com.becon.opencelium.backend.enums.ActivReqStatus;
import com.becon.opencelium.backend.utility.MachineUtility;
import com.becon.opencelium.backend.utility.crypto.HmacUtility;
import com.becon.opencelium.backend.utility.crypto.HmacValidator;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "activation_request", indexes = {@Index(name = "idx_hmac", columnList = "hmac")})
public class ActivationRequest implements HmacValidator {

    @Id
    private String id;

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
    private final String machineUuid = MachineUtility.getMachineUUID();

    @Transient
    private final String macAddress = MachineUtility.getMacAddress();

    @Transient
    private final String processorId = MachineUtility.getProcessorId();

    @Transient
    private final String computerName = MachineUtility.getComputerName();

    public String getId() {
        return id;
    }

    public void setId(String id) {
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

    public String getMachineUuid() {
        return machineUuid;
    }

    public String getMacAddress() {
        return macAddress;
    }

    public String getProcessorId() {
        return processorId;
    }

    public String getComputerName() {
        return computerName;
    }

    @Override
    public boolean verify(String anotherHmac) {
        if (this.id == null) {
            return false;
        }
        if (this.hmac == null) {
            String hmac = HmacUtility.encode(id + MachineUtility.getStringForHmacEncode());
            return Objects.equals(hmac, anotherHmac);
        } else {
            return Objects.equals(this.hmac, anotherHmac);
        }
    }
}