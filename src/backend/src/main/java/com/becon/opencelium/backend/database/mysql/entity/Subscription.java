package com.becon.opencelium.backend.database.mysql.entity;

import com.becon.opencelium.backend.license.HMACValidator;
import com.becon.opencelium.backend.utility.crypto.HMACUtility;
import jakarta.persistence.*;

import java.math.BigInteger;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "subscription")
public class Subscription implements HMACValidator {

    @Id
    private UUID id;

    private String subId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "license_key")
    private String licenseKey;

    @Column(name = "current_usage")
    private Long currentUsage;

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

    public LocalDateTime getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDateTime startDate) {
        this.startDate = startDate;
    }

    public String getLicenseKey() {
        return licenseKey;
    }

    public void setLicenseKey(String licenseKey) {
        this.licenseKey = licenseKey;
    }

    public Long getCurrentUsage() {
        return currentUsage;
    }

    public void setCurrentUsage(Long currentUsage) {
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

    @Override
    public boolean verify(String other) {
        if (this.currentUsageHmac == null) {
            String hmac = generateHmac();
            return Objects.equals(hmac, other);
        } else {
            return Objects.equals(this.currentUsageHmac, other);
        }
    }

    public void generateAndSetHmac() {
        this.currentUsageHmac = generateHmac();
    }

    public String generateHmac() {
        return HMACUtility.encode(
                this.id.toString()
                        + (this.currentUsage == null ? 0 : this.currentUsage.toString())
        );
    }
}
