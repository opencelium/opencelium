package com.becon.opencelium.backend.database.mysql.entity;

import com.becon.opencelium.backend.enums.ActivReqStatus;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "activation_request")
public class ActivationRequest {
    @Id
    private UUID id;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    private String hmac;

    private int ttl;

    @Enumerated(EnumType.STRING)
    private ActivReqStatus status;

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
}
