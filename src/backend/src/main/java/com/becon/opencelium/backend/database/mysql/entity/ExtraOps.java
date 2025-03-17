package com.becon.opencelium.backend.database.mysql.entity;

import com.becon.opencelium.backend.subscription.enums.ExtraOpsStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Entity
@Table(name = "extra_ops")
public class ExtraOps {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscription_id", nullable = false)
    private Subscription subscription;

    // Activation date (start date)
    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    // End date: for example, the end of the month.
    @Column(name = "end_date", nullable = false)
    private LocalDateTime endDate;

    // Status of the extra operations (e.g., ACTIVE, EXPIRED, CONSUMED)
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private ExtraOpsStatus status;

    // Current operations usage
    @Column(name = "current_ops_usage", nullable = false)
    private long currentOpsUsage;

    // HMAC for current operations usage (used to verify integrity)
    @Column(name = "current_ops_usage_hmac", nullable = false)
    private String currentOpsUsageHmac;

    // Total operations usage
    @Column(name = "total_ops_usage", nullable = false)
    private long totalOpsUsage;

    // HMAC for current operations usage (used to verify integrity)
    @Column(name = "total_ops_usage_hmac", nullable = false)
    private String totalOpsUsageHmac;

    // Automatically set creation timestamp
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "generated_at", nullable = false, updatable = false)
    private long generatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Subscription getSubscription() {
        return subscription;
    }

    public void setSubscription(Subscription subscription) {
        this.subscription = subscription;
    }

    public LocalDateTime getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDateTime startDate) {
        this.startDate = startDate;
    }

    public void setStartDate(long unixTime) {
        this.startDate = this.endDate = Instant.ofEpochMilli(unixTime)
                .atZone(ZoneId.of("UTC"))
                .toLocalDateTime();;
    }

    public LocalDateTime getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDateTime endDate) {
        this.endDate = endDate;
    }

    public void setEndDate(long unixTime) {
        this.endDate = Instant.ofEpochMilli(unixTime)
                .atZone(ZoneId.of("UTC"))
                .toLocalDateTime();;
    }

    public ExtraOpsStatus getStatus() {
        return status;
    }

    public void setStatus(ExtraOpsStatus status) {
        this.status = status;
    }

    public long getCurrentOpsUsage() {
        return currentOpsUsage;
    }

    public void setCurrentOpsUsage(long currentOpsUsage) {
        this.currentOpsUsage = currentOpsUsage;
    }

    public String getCurrentOpsUsageHmac() {
        return currentOpsUsageHmac;
    }

    public void setCurrentOpsUsageHmac(String currentOpsUsageHmac) {
        this.currentOpsUsageHmac = currentOpsUsageHmac;
    }

    public long getTotalOpsUsage() {
        return totalOpsUsage;
    }

    public void setTotalOpsUsage(long totalOpsUsage) {
        this.totalOpsUsage = totalOpsUsage;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public String getTotalOpsUsageHmac() {
        return totalOpsUsageHmac;
    }

    public void setTotalOpsUsageHmac(String totalOpsUsageHmac) {
        this.totalOpsUsageHmac = totalOpsUsageHmac;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public long getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(long generatedAt) {
        this.generatedAt = generatedAt;
    }
}
