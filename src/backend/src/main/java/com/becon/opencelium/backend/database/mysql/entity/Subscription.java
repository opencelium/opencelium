package com.becon.opencelium.backend.database.mysql.entity;

import jakarta.persistence.*;

import java.math.BigInteger;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "subscription")
public class Subscription {

    @Id
    private UUID id;

    private String subId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "license_key")
    private String licenseKey;

    @Column(name = "current_usage")
    private BigInteger currentUsage;

    @Column(name = "current_usage_hmac")
    private String currentUsageHmac;

    private boolean active;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "activation_request_id")
    private ActivationRequest activationRequest;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getSubId() {
        return subId;
    }

    public void setSubId(String subId) {
        this.subId = subId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getLicenseKey() {
        return licenseKey;
    }

    public void setLicenseKey(String licenseKey) {
        this.licenseKey = licenseKey;
    }

    public BigInteger getCurrentUsage() {
        return currentUsage;
    }

    public void setCurrentUsage(BigInteger currentUsage) {
        this.currentUsage = currentUsage;
    }

    public String getCurrentUsageHmac() {
        return currentUsageHmac;
    }

    public void setCurrentUsageHmac(String currentUsageHmac) {
        this.currentUsageHmac = currentUsageHmac;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public ActivationRequest getActivationRequest() {
        return activationRequest;
    }

    public void setActivationRequest(ActivationRequest activationRequest) {
        this.activationRequest = activationRequest;
    }
}
