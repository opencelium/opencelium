package com.becon.opencelium.backend.database.mysql.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "subscription")
public class Subscription {

    @Id
    private String id;

    @Column(name = "subId", nullable = false, length = 255)
    private String subId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "license_key", length = 255, nullable = false)
    private String licenseKey;

    @Column(name = "current_usage", nullable = false)
    private long currentUsage;

    @Column(name = "current_usage_hmac", length = 255, nullable = false)
    private String currentUsageHmac;

    @Column(name = "active", nullable = false)
    private boolean active;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "activation_request_id", referencedColumnName = "id")
    private ActivationRequest activationRequest;

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
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

    public long getCurrentUsage() {
        return currentUsage;
    }

    public void setCurrentUsage(long currentUsage) {
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
