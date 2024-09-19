package com.becon.opencelium.backend.database.mysql.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "operation_usage_history")
public class OperationUsageHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "license_id", nullable = false, length = 255)
    private String licenseId;

    @Column(name = "subId", nullable = false, length = 255)
    private String subId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "total_usage", nullable = false)
    private long totalUsage;

    @Column(name = "connection_title", nullable = false, length = 255)
    private String connectionTitle;

    @OneToMany(mappedBy = "operationUsageHistory", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OperationUsageHistoryDetail> details;

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSubId() {
        return subId;
    }

    public void setSubId(String subId) {
        this.subId = subId;
    }

    public String getLicenseId() {
        return licenseId;
    }

    public void setLicenseId(String licenseId) {
        this.licenseId = licenseId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public long getTotalUsage() {
        return totalUsage;
    }

    public void setTotalUsage(long totalUsage) {
        this.totalUsage = totalUsage;
    }

    public String getConnectionTitle() {
        return connectionTitle;
    }

    public void setConnectionTitle(String connectionTitle) {
        this.connectionTitle = connectionTitle;
    }

    public List<OperationUsageHistoryDetail> getDetails() {
        return details;
    }

    public void setDetails(List<OperationUsageHistoryDetail> details) {
        this.details = details;
    }
}
