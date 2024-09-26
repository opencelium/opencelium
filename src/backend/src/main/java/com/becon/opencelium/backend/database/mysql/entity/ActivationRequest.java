package com.becon.opencelium.backend.database.mysql.entity;

import com.becon.opencelium.backend.enums.ActivReqStatus;
import com.becon.opencelium.backend.utility.MachineUtility;
import com.becon.opencelium.backend.utility.crypto.HmacUtility;
import com.becon.opencelium.backend.utility.crypto.HmacValidator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "activation_request", indexes = {@Index(name = "idx_hmac", columnList = "hmac")})
public class ActivationRequest implements HmacValidator {

    @Id
    private String id;

    @JsonIgnore
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "hmac", length = 255, nullable = false)
    private String hmac;

    @Column(name = "ttl", nullable = false)
    private int ttl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", columnDefinition = "ENUM('PENDING', 'PROCESSED', 'EXPIRED')", nullable = false)
    private ActivReqStatus status = ActivReqStatus.PENDING;

    @Transient
    private String machineUuid = MachineUtility.getMachineUUID();

    @Transient
    private String macAddress = MachineUtility.getMacAddress();

    @Transient
    private String systemUUID = MachineUtility.getSystemUuid();

    @Transient
    private String computerName = MachineUtility.getComputerName();

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

    public String getSystemUUID() {
        return systemUUID;
    }

    public String getComputerName() {
        return computerName;
    }

    public void setMachineUuid(String machineUuid) {
        this.machineUuid = machineUuid;
    }

    public void setMacAddress(String macAddress) {
        this.macAddress = macAddress;
    }

    public void setSystemUUID(String systemUUID) {
        this.systemUUID = systemUUID;
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
            String hmac = HmacUtility.encode(id + MachineUtility.getStringForHmacEncode());
            return Objects.equals(hmac, anotherHmac);
        } else {
            return Objects.equals(this.hmac, anotherHmac);
        }
    }
}
